import { NextResponse } from "next/server";

import { buildAuthorizedPaidHistory } from "@/src/lib/history/server";
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
    const identity = await resolveVerifiedWalletIdentity({ sessionUserId, adminClient });
    const [ownedResult, membershipResult] = await Promise.all([
      adminClient.from("treasuries").select("id,name").eq("owner_user_id", identity.userId),
      adminClient.from("treasury_members").select("treasury_id,role").eq("user_id", identity.userId).in("role", ["owner", "treasurer"]),
    ]);
    if (ownedResult.error) throw ownedResult.error;
    if (membershipResult.error) throw membershipResult.error;

    const memberTreasuryIds = (membershipResult.data ?? []).map((membership) => membership.treasury_id);
    const memberTreasuryResult = memberTreasuryIds.length
      ? await adminClient.from("treasuries").select("id,name").in("id", memberTreasuryIds)
      : { data: [], error: null };
    if (memberTreasuryResult.error) throw memberTreasuryResult.error;
    const managedTreasuries = [
      ...new Map(
        [...(ownedResult.data ?? []), ...(memberTreasuryResult.data ?? [])].map((treasury) => [treasury.id, treasury]),
      ).values(),
    ];
    if (managedTreasuries.length === 0) return NextResponse.json({ history: [] });

    const treasuryIds = managedTreasuries.map((treasury) => treasury.id);
    const [claimResult, categoryResult] = await Promise.all([
      adminClient
        .from("claims")
        .select("id,treasury_id,category_id,status,payment_status,approved_amount_minor,approved_recipient_sui_address,confirmed_transaction_digest,paid_at")
        .in("treasury_id", treasuryIds)
        .eq("status", "paid")
        .eq("payment_status", "paid")
        .not("confirmed_transaction_digest", "is", null)
        .not("paid_at", "is", null)
        .order("paid_at", { ascending: false }),
      adminClient.from("budget_categories").select("id,name").in("treasury_id", treasuryIds),
    ]);
    if (claimResult.error) throw claimResult.error;
    if (categoryResult.error) throw categoryResult.error;
    return NextResponse.json({
      history: buildAuthorizedPaidHistory({
        managedTreasuries,
        categories: categoryResult.data ?? [],
        claims: claimResult.data ?? [],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment history could not load.";
    return NextResponse.json(
      { error: message },
      { status: /authenticate|verify the connected/i.test(message) ? 401 : 400 },
    );
  }
}
