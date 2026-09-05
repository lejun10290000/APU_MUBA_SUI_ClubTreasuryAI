import "server-only";

import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";

export async function requireMemberClaimSubmission(
  treasuryId: string,
): Promise<void> {
  const userClient = await createServerSupabaseClient();
  const sessionUserId = await requireSupabaseUserId(userClient);
  const adminClient = createAdminSupabaseClient();
  const identity = await resolveVerifiedWalletIdentity({
    sessionUserId,
    adminClient,
  });

  const { data: membership, error } = await adminClient
    .from("treasury_members")
    .select("role")
    .eq("treasury_id", treasuryId)
    .eq("user_id", identity.userId)
    .maybeSingle();
  if (error) throw error;
  if (!membership || membership.role !== "member") {
    throw new Error(
      "Only treasury members can submit reimbursement claims.",
    );
  }
}
