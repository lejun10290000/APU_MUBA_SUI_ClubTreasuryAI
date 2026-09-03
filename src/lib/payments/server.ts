import "server-only";

import { SuiGrpcClient } from "@mysten/sui/grpc";
import { serverConfig } from "@/src/config/env";
import type { PaymentChainStatusProvider } from "./contracts";
import { createSuiPaymentChainStatusProvider } from "./chain-status";
import type { Stage6ClaimRepository } from "@/src/lib/claims";
import {
  parseSuiTreasuryObject,
  type PaymentPreflightTreasuryReader,
} from "./preflight";

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

type TreasuryObjectReader = {
  getObject(input: { objectId: string; include: { content: true } }): Promise<{
    object: {
      objectId: string;
      type: string;
      content: Uint8Array;
    };
  }>;
};

export function createSuiPaymentPreflightTreasuryReader(
  client: TreasuryObjectReader,
  config: { packageId: string; coinType: string },
): PaymentPreflightTreasuryReader {
  return {
    async readTreasury(objectId) {
      const response = await client.getObject({
        objectId,
        include: { content: true },
      });
      if (!response.object?.content) {
        throw new Error("Sui Treasury BCS content is unavailable.");
      }
      return parseSuiTreasuryObject({
        requestedObjectId: objectId,
        expectedType: `${config.packageId}::treasury::Treasury<${config.coinType}>`,
        objectId: response.object.objectId,
        type: response.object.type,
        content: response.object.content,
      });
    },
  };
}

export async function getPaymentPreflightTreasuryReader(
  repository: Stage6ClaimRepository,
  attemptId: string,
): Promise<PaymentPreflightTreasuryReader> {
  const packageId = serverConfig.NEXT_PUBLIC_SUI_PACKAGE_ID;
  if (!packageId) {
    throw new Error("The Sui Testnet package ID is not configured.");
  }
  if (serverConfig.NEXT_PUBLIC_CLAIM_DATA_MODE === "mock") {
    const persisted = await repository.loadPaymentPreflightState(attemptId);
    if (!persisted) {
      throw new Error("Payment attempt preflight state is missing.");
    }
    const remainingMinor =
      persisted.category.allocatedMinor - persisted.category.spentMinor;
    return {
      async readTreasury(objectId) {
        return {
          objectId,
          type: `${packageId}::treasury::Treasury<${serverConfig.NEXT_PUBLIC_SUI_USDC_COIN_TYPE}>`,
          allocationsConfirmed: true,
          custodyBaseUnits: BigInt(remainingMinor) * 10_000n,
          categories: [
            {
              reference: persisted.category.externalReference,
              allocatedBaseUnits:
                BigInt(persisted.category.allocatedMinor) * 10_000n,
              remainingBaseUnits: BigInt(remainingMinor) * 10_000n,
            },
          ],
        };
      },
    };
  }
  return createSuiPaymentPreflightTreasuryReader(
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
