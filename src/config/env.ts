import { z } from "zod";

const booleanString = z.enum(["true", "false"]).transform((value) => value === "true");

const serverSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  AI_MODE: z.enum(["mock", "live"]).default("mock"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_LIVE_REQUESTS_ENABLED: booleanString.default("false"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUI_NETWORK: z.enum(["testnet"]).default("testnet"),
  NEXT_PUBLIC_SUI_RPC_URL: z.string().url().default("https://fullnode.testnet.sui.io:443"),
  NEXT_PUBLIC_SUI_USDC_COIN_TYPE: z
    .string()
    .default("0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC"),
});

const parsed = serverSchema.parse({
  APP_ENV: process.env.APP_ENV,
  AI_MODE: process.env.AI_MODE,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
  GEMINI_LIVE_REQUESTS_ENABLED: process.env.GEMINI_LIVE_REQUESTS_ENABLED,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK,
  NEXT_PUBLIC_SUI_RPC_URL: process.env.NEXT_PUBLIC_SUI_RPC_URL,
  NEXT_PUBLIC_SUI_USDC_COIN_TYPE: process.env.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
});

if (parsed.AI_MODE === "live") {
  if (!parsed.GEMINI_LIVE_REQUESTS_ENABLED) {
    throw new Error("AI_MODE=live requires GEMINI_LIVE_REQUESTS_ENABLED=true.");
  }
  if (!parsed.GEMINI_API_KEY) {
    throw new Error("AI_MODE=live requires a server-side GEMINI_API_KEY.");
  }
}

export const serverConfig = parsed;

export const publicConfig = {
  appUrl: parsed.NEXT_PUBLIC_APP_URL,
  aiMode: parsed.AI_MODE,
  geminiLiveRequestsEnabled: parsed.GEMINI_LIVE_REQUESTS_ENABLED,
  suiNetwork: parsed.NEXT_PUBLIC_SUI_NETWORK,
  suiRpcUrl: parsed.NEXT_PUBLIC_SUI_RPC_URL,
  suiUsdcCoinType: parsed.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
} as const;
