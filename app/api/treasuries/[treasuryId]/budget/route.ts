import { NextResponse } from "next/server";
import { z } from "zod";

import { checkBudgetTotal } from "@/src/domain/budget-rules";
import { asMinorAmount } from "@/src/domain/money";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import type { BudgetCategoryRow } from "@/src/lib/supabase/database.types";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";
import {
  assertUniqueCategoryReferences,
  toSuiCategoryReference,
} from "@/src/lib/treasuries/category-reference";
import { mapPersistedBudgetCategory } from "@/src/lib/treasuries/types";

const paramsSchema = z.object({ treasuryId: z.string().uuid() });
const budgetSchema = z
  .object({
    categories: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(80),
          allocationMinor: z
            .number()
            .int()
            .positive()
            .max(Number.MAX_SAFE_INTEGER),
        }),
      )
      .min(1),
  })
  .superRefine(({ categories }, context) => {
    const names = new Set<string>();
    for (const category of categories) {
      const normalized = category.name.trim().toLocaleLowerCase("en-US");
      if (names.has(normalized)) {
        context.addIssue({
          code: "custom",
          message: "Budget category names must be unique.",
          path: ["categories"],
        });
        return;
      }
      names.add(normalized);
    }
  });

export async function PUT(
  request: Request,
  context: { params: Promise<{ treasuryId: string }> },
) {
  try {
    const { treasuryId } = paramsSchema.parse(await context.params);
    const { categories } = budgetSchema.parse(await request.json());
    const client = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(client);
    await resolveVerifiedWalletIdentity({
      sessionUserId,
      adminClient: createAdminSupabaseClient(),
    });

    const { data: treasury, error: treasuryError } = await client
      .from("treasuries")
      .select(
        "id,total_budget_minor,status,budget_locked_at,sui_activation_status",
      )
      .eq("id", treasuryId)
      .eq("status", "active")
      .maybeSingle();
    if (treasuryError) throw treasuryError;
    if (!treasury) {
      return NextResponse.json(
        { error: "The active treasury could not be found." },
        { status: 404 },
      );
    }

    if (
      treasury.budget_locked_at !== null ||
      treasury.sui_activation_status !== "not_started"
    ) {
      return NextResponse.json(
        { error: "Budget is locked because Sui activation has started." },
        { status: 409 },
      );
    }

    assertUniqueCategoryReferences(categories.map((category) => category.name));

    const budgetCheck = checkBudgetTotal(
      asMinorAmount(treasury.total_budget_minor),
      categories.map((category) => asMinorAmount(category.allocationMinor)),
    );
    if (!budgetCheck.isBalanced) {
      return NextResponse.json(
        { error: "Budget categories must sum exactly to the treasury total." },
        { status: 400 },
      );
    }

    const { data: canManage, error: managerError } = await client.rpc(
      "can_manage_treasury",
      { p_treasury_id: treasuryId },
    );
    if (managerError) throw managerError;
    if (!canManage) {
      return NextResponse.json(
        { error: "Treasurer role required." },
        { status: 403 },
      );
    }

    const { data, error } = await client.rpc("replace_treasury_budget", {
      p_treasury_id: treasuryId,
      p_categories: categories.map((category) => ({
        name: category.name.trim(),
        external_reference: toSuiCategoryReference(category.name),
        allocated_minor: category.allocationMinor,
      })),
    });
    if (error) throw error;

    return NextResponse.json({
      categories: (data as BudgetCategoryRow[]).map(
        mapPersistedBudgetCategory,
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The budget could not be saved.";
    const status = /authenticate|verify the connected/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
