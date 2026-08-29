import { isValidSuiObjectId } from "@mysten/sui/utils";
import { suiConfig } from "./config";
import { SuiIntegrationError } from "./errors";

export type SuiDeploymentConfig = {
  network: "testnet";
  packageId: string | null;
  usdcCoinType: string;
};

export const suiDeploymentConfig: SuiDeploymentConfig = {
  network: suiConfig.network,
  packageId: suiConfig.packageId,
  usdcCoinType: suiConfig.usdcCoinType,
};

export function requirePackageId(config: SuiDeploymentConfig) {
  if (config.packageId === null) {
    throw new SuiIntegrationError(
      "DEPLOYMENT_NOT_READY",
      "The Sui Testnet package ID has not been configured.",
    );
  }
  if (!isValidSuiObjectId(config.packageId)) {
    throw new SuiIntegrationError(
      "INVALID_PACKAGE_ID",
      "The configured Sui package ID is invalid.",
    );
  }
  return config.packageId;
}

export function isDeploymentReady(config: SuiDeploymentConfig) {
  return config.packageId !== null && isValidSuiObjectId(config.packageId);
}
