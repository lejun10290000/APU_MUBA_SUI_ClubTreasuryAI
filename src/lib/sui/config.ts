import { publicConfig } from "@/src/config/public-env";

export const suiConfig = {
  network: publicConfig.suiNetwork,
  rpcUrl: publicConfig.suiRpcUrl,
  packageId: publicConfig.suiPackageId,
  treasurerCapObjectId: publicConfig.suiTreasurerCapObjectId,
  usdcCoinType: publicConfig.suiUsdcCoinType,
} as const;

export const isSuiDeploymentConfigured = suiConfig.packageId !== null;

export type SuiConfig = typeof suiConfig;
