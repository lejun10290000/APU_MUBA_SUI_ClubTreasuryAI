import { z } from "zod";

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

const publicSchema = z
  .object({
    NEXT_PUBLIC_CLAIM_DATA_MODE: z.enum(["mock", "live"]).default("mock"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    NEXT_PUBLIC_SUI_NETWORK: z.enum(["testnet"]).default("testnet"),
    NEXT_PUBLIC_SUI_RPC_URL: z
      .string()
      .url()
      .default("https://fullnode.testnet.sui.io:443"),
    NEXT_PUBLIC_SUI_PACKAGE_ID: optionalString,
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
  })
  .superRefine((config, context) => {
    if (config.NEXT_PUBLIC_CLAIM_DATA_MODE !== "live") {
      return;
    }
    for (const key of [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
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

// Keep direct NEXT_PUBLIC_* property access so Next.js can inline only values
// that are explicitly safe for the browser bundle.
const parsed = publicSchema.parse({
  NEXT_PUBLIC_CLAIM_DATA_MODE: process.env.NEXT_PUBLIC_CLAIM_DATA_MODE,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK,
  NEXT_PUBLIC_SUI_RPC_URL: process.env.NEXT_PUBLIC_SUI_RPC_URL,
  NEXT_PUBLIC_SUI_PACKAGE_ID:
    process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || undefined,
  NEXT_PUBLIC_SUI_USDC_COIN_TYPE: process.env.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
  NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID:
    process.env.NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

export const publicConfig = {
  appUrl: parsed.NEXT_PUBLIC_APP_URL,
  claimDataMode: parsed.NEXT_PUBLIC_CLAIM_DATA_MODE,
  suiNetwork: parsed.NEXT_PUBLIC_SUI_NETWORK,
  suiRpcUrl: parsed.NEXT_PUBLIC_SUI_RPC_URL,
  suiPackageId: parsed.NEXT_PUBLIC_SUI_PACKAGE_ID ?? null,
  suiUsdcCoinType: parsed.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
  demoTreasuryObjectId: parsed.NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID,
  supabaseUrl: parsed.NEXT_PUBLIC_SUPABASE_URL ?? null,
  supabasePublishableKey: parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null,
} as const;
