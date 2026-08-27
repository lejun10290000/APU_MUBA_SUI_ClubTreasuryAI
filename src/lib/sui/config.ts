import { publicConfig } from "@/src/config/env";

export const suiConfig = {
  network: publicConfig.suiNetwork,
  rpcUrl: publicConfig.suiRpcUrl,
  usdcCoinType: publicConfig.suiUsdcCoinType,
} as const;

export type SuiConfig = typeof suiConfig;
