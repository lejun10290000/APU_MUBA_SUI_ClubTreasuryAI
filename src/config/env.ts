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
        "0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7",
      ),
    NEXT_PUBLIC_SUI_USDC_COIN_TYPE: z
      .string()
      .default(
        "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC",
      ),
    NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID: z
      .string()
      .default(
        "0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4",
      ),
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
    SUPABASE_SECRET_KEY: optionalString,
    SUPABASE_RECEIPTS_BUCKET: z.string().trim().min(1).default("receipts"),
  })
  .superRefine((config, context) => {
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
    process.env.NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_RECEIPTS_BUCKET: process.env.SUPABASE_RECEIPTS_BUCKET,
});

export const serverConfig = parsed;
