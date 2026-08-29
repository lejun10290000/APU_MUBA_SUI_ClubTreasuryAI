import { publicConfig } from "@/src/config/env";

export const suiConfig = {
  network: publicConfig.suiNetwork,
  rpcUrl: publicConfig.suiRpcUrl,
  packageId: publicConfig.suiPackageId,
  usdcCoinType: publicConfig.suiUsdcCoinType,
} as const;

export const isSuiDeploymentConfigured = suiConfig.packageId !== null;

export type SuiConfig = typeof suiConfig;
