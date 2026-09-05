import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Stage 8 final security boundaries", () => {
  it("requires an authenticated verified wallet before constructing the live claim repository", () => {
    const factory = source("src/lib/claims/supabase-repository-factory.ts");
    expect(factory).toContain("requireSupabaseUserId");
    expect(factory).toContain("resolveVerifiedWalletIdentity");
  });

  it("keeps claim decisions behind the repository authorization boundary", () => {
    const decisionRoute = source("app/api/claims/[claimId]/decision/route.ts");
    const factory = source("src/lib/claims/supabase-repository-factory.ts");
    expect(decisionRoute).toContain("getClaimRepository");
    expect(decisionRoute).toContain("decideClaim");
    expect(factory).toContain("requireSupabaseUserId");
    expect(factory).toContain("resolveVerifiedWalletIdentity");
  });

  it("does not expose secret values from the health response", () => {
    const healthRoute = source("app/api/health/route.ts");
    expect(healthRoute).toContain("apiKeyConfigured: Boolean(serverConfig.GEMINI_API_KEY)");
    expect(healthRoute).not.toContain("apiKey: serverConfig.GEMINI_API_KEY");
    expect(healthRoute).not.toContain("secretKey: serverConfig.SUPABASE_SECRET_KEY");
  });

  it("preserves manager authorization in claim approval SQL", () => {
    const migration = source(
      "supabase/migrations/20260905114500_stage8_a2_decide_claim_ambiguity_hotfix.sql",
    );
    expect(migration).toContain("public.can_manage_treasury(claim_row.treasury_id)");
    expect(migration).toContain("approved_recipient_sui_address");
    expect(migration).toContain("approved_amount_minor");
    expect(migration).toContain("approved_treasury_object_id");
  });
});
