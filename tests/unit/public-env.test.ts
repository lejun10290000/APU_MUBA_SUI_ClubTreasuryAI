import { afterEach, describe, expect, it, vi } from "vitest";

const cleanStage6Treasury =
  "0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3";
const cleanStage6TreasurerCap =
  "0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101";

describe("public environment configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the clean Stage 6 acceptance Treasury and TreasurerCap by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_SUI_TREASURER_CAP_OBJECT_ID", "");
    vi.resetModules();

    const { publicConfig } = await import("@/src/config/public-env");

    expect(publicConfig.demoTreasuryObjectId).toBe(cleanStage6Treasury);
    expect(publicConfig.suiTreasurerCapObjectId).toBe(cleanStage6TreasurerCap);
  });

  it("loads live browser configuration without requiring a server secret", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLAIM_DATA_MODE", "live");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://example-project.supabase.co",
    );
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_browser_test",
    );
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.resetModules();

    const { publicConfig } = await import("@/src/config/public-env");

    expect(publicConfig.claimDataMode).toBe("live");
    expect(publicConfig.supabaseUrl).toBe(
      "https://example-project.supabase.co",
    );
    expect(publicConfig.supabasePublishableKey).toBe(
      "sb_publishable_browser_test",
    );
    expect(publicConfig).not.toHaveProperty("SUPABASE_SECRET_KEY");
  });
});