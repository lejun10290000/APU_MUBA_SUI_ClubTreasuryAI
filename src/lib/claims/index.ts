import "server-only";

import { serverConfig } from "@/src/config/env";
import { MockClaimRepository } from "./mock-repository";
import { createSupabaseClaimRepository } from "./supabase-repository";

export type { ClaimRepository, Stage6ClaimRepository } from "./types";

export async function getClaimRepository() {
  return serverConfig.NEXT_PUBLIC_CLAIM_DATA_MODE === "live"
    ? createSupabaseClaimRepository()
    : new MockClaimRepository();
}
