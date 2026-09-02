import { afterEach, describe, expect, it, vi } from "vitest";

const cleanStage6Treasury =
  "0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3";
const cleanStage6TreasurerCap =
  "0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101";

describe("server environment configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the clean Stage 6 Treasury and TreasurerCap by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUI_TREASURER_CAP_OBJECT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID", "");
    vi.resetModules();

    const { serverConfig } = await import("@/src/config/env");

    expect(serverConfig.NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID).toBe(
      cleanStage6Treasury,
    );
    expect(serverConfig.NEXT_PUBLIC_SUI_TREASURER_CAP_OBJECT_ID).toBe(
      cleanStage6TreasurerCap,
    );
  });

  it.each([
    "http://clubtreasury.example",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "https://[::1]:3000",
  ])("rejects %s as a production app URL", async (appUrl) => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl);
    vi.resetModules();

    await expect(import("@/src/config/env")).rejects.toThrow(
      /HTTPS.*non-localhost/i,
    );
  });

  it("accepts a deployed HTTPS origin in production", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://clubtreasury.example");
    vi.resetModules();

    const { serverConfig } = await import("@/src/config/env");

    expect(serverConfig.NEXT_PUBLIC_APP_URL).toBe(
      "https://clubtreasury.example",
    );
  });
});
