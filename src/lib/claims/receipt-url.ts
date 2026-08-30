import "server-only";

import { serverConfig } from "@/src/config/env";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";

export async function createAuthorizedReceiptUrl(claimId: string) {
  if (serverConfig.NEXT_PUBLIC_CLAIM_DATA_MODE !== "live") {
    return null;
  }
  const userClient = await createServerSupabaseClient();
  await requireSupabaseUserId(userClient);
  const { data: claim, error } = await userClient
    .from("claims")
    .select("receipt_path")
    .eq("id", claimId)
    .single();
  if (error) throw error;
  const { data, error: signedUrlError } = await createAdminSupabaseClient()
    .storage.from(serverConfig.SUPABASE_RECEIPTS_BUCKET)
    .createSignedUrl(claim.receipt_path, 60);
  if (signedUrlError) throw signedUrlError;
  return data.signedUrl;
}
