import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userClient = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(userClient);
    const adminClient = createAdminSupabaseClient();
    const identity = await resolveVerifiedWalletIdentity({
      sessionUserId,
      adminClient,
    });

    const [ownedResult, membershipResult] = await Promise.all([
      adminClient
        .from("treasuries")
        .select("id,name")
        .eq("owner_user_id", identity.userId),
      adminClient
        .from("treasury_members")
        .select("treasury_id,role")
        .eq("user_id", identity.userId)
        .in("role", ["owner", "treasurer"]),
    ]);
    if (ownedResult.error) throw ownedResult.error;
    if (membershipResult.error) throw membershipResult.error;

    const memberTreasuryIds = (membershipResult.data ?? []).map(
      (membership) => membership.treasury_id,
    );
    const memberTreasuryResult = memberTreasuryIds.length
      ? await adminClient
          .from("treasuries")
          .select("id,name")
          .in("id", memberTreasuryIds)
      : { data: [], error: null };
    if (memberTreasuryResult.error) throw memberTreasuryResult.error;

    const managedTreasuries = [
      ...new Map(
        [...(ownedResult.data ?? []), ...(memberTreasuryResult.data ?? [])].map(
          (treasury) => [treasury.id, treasury],
        ),
      ).values(),
    ];
    if (managedTreasuries.length === 0) {
      return NextResponse.json({ claims: [] });
    }

    const treasuryIds = managedTreasuries.map((treasury) => treasury.id);
    const [claimResult, categoryResult] = await Promise.all([
      adminClient
        .from("claims")
        .select(
          "id,treasury_id,category_id,status,payment_status,merchant,submitter_name,requested_amount_minor,recommendation,created_at",
        )
        .in("treasury_id", treasuryIds)
        .in("status", ["submitted", "under_review", "approved_unpaid"])
        .order("created_at", { ascending: false }),
      adminClient
        .from("budget_categories")
        .select("id,name")
        .in("treasury_id", treasuryIds),
    ]);
    if (claimResult.error) throw claimResult.error;
    if (categoryResult.error) throw categoryResult.error;

    const treasuryNames = new Map(
      managedTreasuries.map((treasury) => [treasury.id, treasury.name]),
    );
    const categoryNames = new Map(
      (categoryResult.data ?? []).map((category) => [category.id, category.name]),
    );

    return NextResponse.json({
      claims: (claimResult.data ?? []).map((claim) => ({
        id: claim.id,
        treasuryName: treasuryNames.get(claim.treasury_id) ?? "Treasury",
        categoryName: categoryNames.get(claim.category_id) ?? "Category",
        merchant: claim.merchant,
        submitterName: claim.submitter_name,
        requestedAmountMinor: claim.requested_amount_minor,
        recommendation: claim.recommendation,
        status: claim.status,
        paymentStatus: claim.payment_status,
        createdAt: claim.created_at,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Managed claims could not load.";
    return NextResponse.json(
      { error: message },
      { status: /authenticate|verify the connected/i.test(message) ? 401 : 400 },
    );
  }
}
