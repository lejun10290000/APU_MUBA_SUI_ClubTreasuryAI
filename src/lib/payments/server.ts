import "server-only";

import { SuiGrpcClient } from "@mysten/sui/grpc";
import { serverConfig } from "@/src/config/env";
import type { PaymentChainStatusProvider } from "./contracts";
import { createSuiPaymentChainStatusProvider } from "./chain-status";

export function getPaymentChainStatusProvider(): PaymentChainStatusProvider {
  const packageId = serverConfig.NEXT_PUBLIC_SUI_PACKAGE_ID;
  if (!packageId) {
    throw new Error("The Sui Testnet package ID is not configured.");
  }
  return createSuiPaymentChainStatusProvider(
    new SuiGrpcClient({
      network: "testnet",
      baseUrl: serverConfig.NEXT_PUBLIC_SUI_RPC_URL,
    }),
    {
      packageId,
      coinType: serverConfig.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
    },
  );
}
