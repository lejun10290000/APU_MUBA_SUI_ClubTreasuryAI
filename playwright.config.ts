import { defineConfig } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = `http://127.0.0.1:${port}`;
const testDistDir = ".next-playwright";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "corepack pnpm dev",
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI && !process.env.PLAYWRIGHT_PORT,
    timeout: 120_000,
    env: {
      PORT: port,
      NEXT_DIST_DIR: testDistDir,
      AI_MODE: "mock",
      GEMINI_LIVE_REQUESTS_ENABLED: "false",
      NEXT_PUBLIC_CLAIM_DATA_MODE: "mock",
      NEXT_PUBLIC_SUI_PACKAGE_ID: "",
    },
  },
});
