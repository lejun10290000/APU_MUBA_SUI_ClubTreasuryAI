import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().url().optional(),
);

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.startsWith("127.") ||
    hostname === "[::1]"
  );
}

const serverSchema = z
  .object({
    APP_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    AI_MODE: z.enum(["mock", "live"]).default("mock"),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
    GEMINI_LIVE_REQUESTS_ENABLED: booleanString,
    NEXT_PUBLIC_CLAIM_DATA_MODE: z.enum(["mock", "live"]).default("mock"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SUI_NETWORK: z.enum(["testnet"]).default("testnet"),
    NEXT_PUBLIC_SUI_RPC_URL: z
      .string()
      .url()
      .default("https://fullnode.testnet.sui.io:443"),
    NEXT_PUBLIC_SUI_PACKAGE_ID: z.string().trim().min(1).optional(),
    NEXT_PUBLIC_SUI_TREASURER_CAP_OBJECT_ID: z
      .string()
      .default(
        "0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101",
      ),
    NEXT_PUBLIC_SUI_USDC_COIN_TYPE: z
      .string()
      .default(
        "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC",
      ),
    NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID: z
      .string()
      .default(
        "0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3",
      ),
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
    SUPABASE_SECRET_KEY: optionalString,
    SUPABASE_RECEIPTS_BUCKET: z.string().trim().min(1).default("receipts"),
  })
  .superRefine((config, context) => {
    if (config.APP_ENV === "production") {
      const appUrl = new URL(config.NEXT_PUBLIC_APP_URL);
      if (appUrl.protocol !== "https:" || isLoopbackHostname(appUrl.hostname)) {
        context.addIssue({
          code: "custom",
          message:
            "NEXT_PUBLIC_APP_URL must use HTTPS and a non-localhost host in production.",
          path: ["NEXT_PUBLIC_APP_URL"],
        });
      }
    }
    if (config.NEXT_PUBLIC_CLAIM_DATA_MODE !== "live") {
      return;
    }
    for (const key of [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SECRET_KEY",
    ] as const) {
      if (!config[key]) {
        context.addIssue({
          code: "custom",
          message: `${key} is required when NEXT_PUBLIC_CLAIM_DATA_MODE=live.`,
          path: [key],
        });
      }
    }
  });

const parsed = serverSchema.parse({
  APP_ENV: process.env.APP_ENV,
  AI_MODE: process.env.AI_MODE,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GEMINI_LIVE_REQUESTS_ENABLED: process.env.GEMINI_LIVE_REQUESTS_ENABLED,
  NEXT_PUBLIC_CLAIM_DATA_MODE: process.env.NEXT_PUBLIC_CLAIM_DATA_MODE,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK,
  NEXT_PUBLIC_SUI_RPC_URL: process.env.NEXT_PUBLIC_SUI_RPC_URL,
  NEXT_PUBLIC_SUI_PACKAGE_ID:
    process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || undefined,
  NEXT_PUBLIC_SUI_TREASURER_CAP_OBJECT_ID:
    process.env.NEXT_PUBLIC_SUI_TREASURER_CAP_OBJECT_ID || undefined,
  NEXT_PUBLIC_SUI_USDC_COIN_TYPE: process.env.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
  NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID:
    process.env.NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID || undefined,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_RECEIPTS_BUCKET: process.env.SUPABASE_RECEIPTS_BUCKET,
});

export const serverConfig = parsed;
