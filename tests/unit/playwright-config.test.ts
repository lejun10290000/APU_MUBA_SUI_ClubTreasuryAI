import { afterEach, describe, expect, it, vi } from "vitest";

describe("Playwright smoke configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses PLAYWRIGHT_PORT for the smoke server and base URL", async () => {
    vi.stubEnv("PLAYWRIGHT_PORT", "3100");
    vi.resetModules();

    const { default: config } = await import("../../playwright.config");
    const webServer = config.webServer as {
      env: Record<string, string>;
      url: string;
    };

    expect(config.use?.baseURL).toBe("http://127.0.0.1:3100");
    expect(webServer.url).toBe("http://127.0.0.1:3100/api/health");
    expect(webServer.env.PORT).toBe("3100");
    expect(webServer.env.NEXT_DIST_DIR).toBe(".next-playwright");
    expect(webServer).toMatchObject({ reuseExistingServer: false });
  });
});
