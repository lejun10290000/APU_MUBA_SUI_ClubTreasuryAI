import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "corepack pnpm dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AI_MODE: "mock",
      GEMINI_LIVE_REQUESTS_ENABLED: "false",
      NEXT_PUBLIC_CLAIM_DATA_MODE: "mock",
      NEXT_PUBLIC_SUI_PACKAGE_ID: "",
    },
  },
});
