import { afterEach, describe, expect, it, vi } from "vitest";

describe("public environment configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
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
