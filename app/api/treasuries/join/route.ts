import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import type {
  BudgetCategoryRow,
  TreasuryRow,
} from "@/src/lib/supabase/database.types";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";
import { normalizeJoinCode } from "@/src/lib/treasuries/join-code";
import {
  mapPersistedTreasuryWorkspace,
  type PersistedTreasuryRole,
} from "@/src/lib/treasuries/types";

const joinSchema = z.object({
  joinCode: z.string().trim().min(1).max(32).transform(normalizeJoinCode),
});

export async function POST(request: Request) {
  try {
    const input = joinSchema.parse(await request.json());
    const client = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(client);
    const adminClient = createAdminSupabaseClient();
    const identity = await resolveVerifiedWalletIdentity({
      sessionUserId,
      adminClient,
    });

    const { data: adminTreasury, error: treasuryLookupError } =
      await adminClient
        .from("treasuries")
        .select("*")
        .eq("join_code", input.joinCode)
        .maybeSingle();
    if (treasuryLookupError) throw treasuryLookupError;
    if (!adminTreasury) {
      throw new Error("An active treasury with that join code was not found.");
    }
    if (
      adminTreasury.status !== "active" ||
      adminTreasury.sui_activation_status !== "active" ||
      !adminTreasury.sui_treasury_object_id ||
      !adminTreasury.sui_treasurer_cap_object_id
    ) {
      throw new Error("This treasury is not yet active on Sui.");
    }

    const { data: existingMembership, error: membershipLookupError } =
      await adminClient
        .from("treasury_members")
        .select("treasury_id,user_id,role")
        .eq("treasury_id", adminTreasury.id)
        .eq("user_id", identity.userId)
        .maybeSingle();
    if (membershipLookupError) throw membershipLookupError;

    let role: PersistedTreasuryRole =
      adminTreasury.owner_user_id === identity.userId
        ? "owner"
        : ((existingMembership?.role as PersistedTreasuryRole | undefined) ??
          "member");
    if (!existingMembership && role === "member") {
      const { error: insertError } = await adminClient
        .from("treasury_members")
        .insert({
          treasury_id: adminTreasury.id,
          user_id: identity.userId,
          role: "member",
        });
      if (insertError) throw insertError;
    }

    const { data: treasury, error: treasuryError } = await client
      .from("treasuries")
      .select("*")
      .eq("id", adminTreasury.id)
      .eq("status", "active")
      .single();
    if (treasuryError) throw treasuryError;
    if (treasury.owner_user_id === identity.userId) role = "owner";

    const { data: categories, error: categoryError } = await client
      .from("budget_categories")
      .select("*")
      .eq("treasury_id", treasury.id)
      .order("created_at", { ascending: true });
    if (categoryError) throw categoryError;

    return NextResponse.json({
      treasury: mapPersistedTreasuryWorkspace({
        treasury: treasury as TreasuryRow,
        categories: (categories ?? []) as BudgetCategoryRow[],
        role,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The treasury could not be joined.";
    return NextResponse.json(
      { error: message },
      {
        status: /authenticate|verify the connected/i.test(message)
          ? 401
          : /not yet active on Sui/i.test(message)
            ? 409
            : 400,
      },
    );
  }
}
