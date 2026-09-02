import { afterEach, describe, expect, it, vi } from "vitest";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns a non-secret Stage 7 readiness contract without caching", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = GET();
    const body = await response.json();

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      ok: true,
      ready: expect.any(Boolean),
      service: "clubtreasury-ai",
      stage: 7,
      readiness: {
        ai: {
          mode: expect.any(String),
          liveRequestsEnabled: expect.any(Boolean),
          apiKeyConfigured: expect.any(Boolean),
        },
        claims: {
          mode: expect.any(String),
          supabaseConfigured: expect.any(Boolean),
        },
        sui: {
          network: "testnet",
          packageConfigured: expect.any(Boolean),
        },
      },
    });
    expect(JSON.stringify(body)).not.toMatch(
      /GEMINI_API_KEY|SUPABASE_SECRET_KEY|sk-[a-z0-9]/i,
    );
  });

  it("does not report Supabase ready while claims are in mock mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLAIM_DATA_MODE", "mock");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable");
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-server-secret");
    vi.stubEnv("NEXT_PUBLIC_SUI_PACKAGE_ID", "");
    vi.resetModules();

    const { GET } = await import("@/app/api/health/route");

    await expect(GET().json()).resolves.toMatchObject({
      ready: false,
      readiness: { claims: { mode: "mock", supabaseConfigured: false } },
    });
  });

  it("reports ready only when every active integration is configured", async () => {
    vi.stubEnv("AI_MODE", "mock");
    vi.stubEnv("NEXT_PUBLIC_CLAIM_DATA_MODE", "mock");
    vi.stubEnv("NEXT_PUBLIC_SUI_PACKAGE_ID", "0xstage7-package");
    vi.resetModules();

    const { GET } = await import("@/app/api/health/route");

    await expect(GET().json()).resolves.toMatchObject({ ready: true });
  });
});
