import { afterEach, describe, expect, it, vi } from "vitest";

describe("Next.js configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the test-only output directory supplied by Playwright", async () => {
    vi.stubEnv("NEXT_DIST_DIR", ".next-playwright-3100");
    vi.resetModules();

    const { default: config } = await import("../../next.config");

    expect(config.distDir).toBe(".next-playwright-3100");
  });
});
