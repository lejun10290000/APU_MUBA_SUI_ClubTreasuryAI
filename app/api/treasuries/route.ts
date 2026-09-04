import { randomUUID } from "node:crypto";
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
import { generateJoinCode } from "@/src/lib/treasuries/join-code";
import {
  mapPersistedTreasuryWorkspace,
  type PersistedTreasuryRole,
} from "@/src/lib/treasuries/types";

const createTreasurySchema = z.object({
  name: z.string().trim().min(1).max(120),
  totalBudgetMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

function errorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "The treasury request failed.";
  const status = /authenticate|verify the connected/i.test(message) ? 401 : 400;
  return NextResponse.json({ error: message }, { status });
}

async function requireVerifiedIdentity() {
  const client = await createServerSupabaseClient();
  const sessionUserId = await requireSupabaseUserId(client);
  const identity = await resolveVerifiedWalletIdentity({
    sessionUserId,
    adminClient: createAdminSupabaseClient(),
  });
  return { client, identity };
}

export async function GET() {
  try {
    const { client, identity } = await requireVerifiedIdentity();
    const { data: treasuries, error: treasuryError } = await client
      .from("treasuries")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true });
    if (treasuryError) throw treasuryError;
    if (!treasuries?.length) {
      return NextResponse.json({ treasuries: [] });
    }

    const treasuryIds = treasuries.map((treasury) => treasury.id);
    const [{ data: memberships, error: membershipError }, { data: categories, error: categoryError }] =
      await Promise.all([
        client
          .from("treasury_members")
          .select("treasury_id,role")
          .eq("user_id", identity.userId)
          .in("treasury_id", treasuryIds),
        client
          .from("budget_categories")
          .select("*")
          .in("treasury_id", treasuryIds)
          .order("created_at", { ascending: true }),
      ]);
    if (membershipError) throw membershipError;
    if (categoryError) throw categoryError;

    const roles = new Map(
      (memberships ?? []).map((membership) => [
        membership.treasury_id,
        membership.role as PersistedTreasuryRole,
      ]),
    );
    const workspaces = (treasuries as TreasuryRow[]).flatMap((treasury) => {
      const role =
        treasury.owner_user_id === identity.userId
          ? "owner"
          : roles.get(treasury.id);
      if (!role) return [];
      return [
        mapPersistedTreasuryWorkspace({
          treasury,
          role,
          categories: (categories as BudgetCategoryRow[]).filter(
            (category) => category.treasury_id === treasury.id,
          ),
        }),
      ];
    });

    return NextResponse.json({ treasuries: workspaces });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = createTreasurySchema.parse(await request.json());
    const { client, identity } = await requireVerifiedIdentity();
    const externalReference = randomUUID();
    let inserted = false;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { error } = await client.from("treasuries").insert({
        owner_user_id: identity.userId,
        external_reference: externalReference,
        name: input.name,
        currency: "USDC",
        total_budget_minor: input.totalBudgetMinor,
        sui_treasury_object_id: null,
        join_code: generateJoinCode(),
        status: "active",
      });
      if (!error) {
        inserted = true;
        break;
      }
      if (error.code !== "23505" || attempt === 4) throw error;
    }

    if (!inserted) throw new Error("A unique treasury join code could not be generated.");

    const { data: treasury, error: treasuryError } = await client
      .from("treasuries")
      .select("*")
      .eq("owner_user_id", identity.userId)
      .eq("external_reference", externalReference)
      .single();
    if (treasuryError) throw treasuryError;

    const { error: membershipError } = await client
      .from("treasury_members")
      .insert({
        treasury_id: treasury.id,
        user_id: identity.userId,
        role: "owner",
      });
    if (membershipError) throw membershipError;

    return NextResponse.json(
      {
        treasury: mapPersistedTreasuryWorkspace({
          treasury,
          categories: [],
          role: "owner",
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
