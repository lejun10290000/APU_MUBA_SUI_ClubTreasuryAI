import "server-only";

import { serverConfig } from "@/src/config/env";
import { MockClaimRepository } from "./mock-repository";
import { createCanonicalSupabaseClaimRepository } from "./supabase-repository-factory";

export type {
  ClaimRepository,
  Stage6ClaimRepository,
  TreasuryLinkState,
} from "./types";

export async function getClaimRepository() {
  return serverConfig.NEXT_PUBLIC_CLAIM_DATA_MODE === "live"
    ? createCanonicalSupabaseClaimRepository()
    : new MockClaimRepository();
}
