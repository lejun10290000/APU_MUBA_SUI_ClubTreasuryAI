import "server-only";

import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";
import { SupabaseClaimRepository } from "./supabase-repository";

export async function createCanonicalSupabaseClaimRepository() {
  const userClient = await createServerSupabaseClient();
  const sessionUserId = await requireSupabaseUserId(userClient);
  const adminClient = createAdminSupabaseClient();
  const identity = await resolveVerifiedWalletIdentity({
    sessionUserId,
    adminClient,
  });

  return new SupabaseClaimRepository(identity, userClient, adminClient);
}
