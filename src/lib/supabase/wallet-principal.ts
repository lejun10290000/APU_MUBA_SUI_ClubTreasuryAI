import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type TypedClient = SupabaseClient<Database>;

export type VerifiedWalletIdentity = {
  userId: string;
  walletAddress: string;
};

export async function resolveVerifiedWalletIdentity({
  sessionUserId,
  adminClient,
}: {
  sessionUserId: string;
  adminClient: TypedClient;
}): Promise<VerifiedWalletIdentity> {
  const { data: nonce, error: nonceError } = await adminClient
    .from("wallet_nonces")
    .select("wallet_address")
    .eq("user_id", sessionUserId)
    .not("consumed_at", "is", null)
    .order("consumed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (nonceError) throw nonceError;
  if (!nonce) {
    throw new Error("Verify the connected Sui wallet before continuing.");
  }

  const { data: profile, error: profileError } = await adminClient
    .from("wallet_profiles")
    .select("user_id,wallet_address")
    .eq("wallet_address", nonce.wallet_address)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) {
    throw new Error("Verify the connected Sui wallet before continuing.");
  }

  return {
    userId: profile.user_id,
    walletAddress: profile.wallet_address,
  };
}
