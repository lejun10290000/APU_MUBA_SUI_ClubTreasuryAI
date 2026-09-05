import "server-only";

import { SuiGrpcClient } from "@mysten/sui/grpc";

import { serverConfig } from "@/src/config/env";
import {
  parseActivationTreasuryObject,
  type ActivationMoveCall,
  type ActivationTransactionEvidence,
} from "@/src/lib/sui/activation-verification";
import { verifyTreasurerCap } from "@/src/lib/sui/treasurer-cap-verification";

function getClient() {
  return new SuiGrpcClient({
    network: "testnet",
    baseUrl: serverConfig.NEXT_PUBLIC_SUI_RPC_URL,
  });
}

export async function readActivationTransaction(
  digest: string,
): Promise<ActivationTransactionEvidence> {
  const result = await getClient().getTransaction({
    digest,
    include: { transaction: true, effects: true, objectTypes: true },
  });
  const transaction =
    result.$kind === "Transaction" ? result.Transaction : result.FailedTransaction;
  const moveCalls: ActivationMoveCall[] = [];
  for (const command of transaction.transaction?.commands ?? []) {
    if ("MoveCall" in command) {
      moveCalls.push({
        packageId: command.MoveCall.package,
        module: command.MoveCall.module,
        function: command.MoveCall.function,
        typeArguments: command.MoveCall.typeArguments,
        objectIds: command.MoveCall.arguments.flatMap((argument) => {
          if (!("Input" in argument)) return [];
          const input = transaction.transaction?.inputs[argument.Input];
          return findObjectIds(input);
        }),
      });
    }
  }
  const createdObjects = (transaction.effects?.changedObjects ?? [])
    .filter(
      (object) =>
        object.idOperation === "Created" && object.outputState === "ObjectWrite",
    )
    .flatMap((object) => {
      const type = transaction.objectTypes?.[object.objectId];
      return type ? [{ objectId: object.objectId, type }] : [];
    });
  return {
    digest: transaction.digest,
    success: result.$kind === "Transaction" && transaction.status.success,
    checkpointed: transaction.checkpoint !== null,
    sender: transaction.transaction?.sender ?? "0x0",
    moveCalls,
    createdObjects,
  };
}

function findObjectIds(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if ("objectId" in value && typeof value.objectId === "string") {
    return [value.objectId];
  }
  return Object.values(value).flatMap(findObjectIds);
}

export async function readActivationTreasury(objectId: string) {
  const packageId = serverConfig.NEXT_PUBLIC_SUI_PACKAGE_ID;
  if (!packageId) throw new Error("The Sui Testnet package ID is not configured.");
  const response = await getClient().getObject({
    objectId,
    include: { content: true },
  });
  return parseActivationTreasuryObject({
    requestedObjectId: objectId,
    expectedType: `${packageId}::treasury::Treasury<${serverConfig.NEXT_PUBLIC_SUI_USDC_COIN_TYPE}>`,
    objectId: response.object.objectId,
    type: response.object.type,
    content: response.object.content,
  });
}

export async function verifyActivationTreasurerCap(input: {
  capObjectId: string;
  ownerWalletAddress: string;
  treasuryObjectId: string;
}) {
  const packageId = serverConfig.NEXT_PUBLIC_SUI_PACKAGE_ID;
  if (!packageId) throw new Error("The Sui Testnet package ID is not configured.");
  return verifyTreasurerCap(getClient(), {
    capObjectId: input.capObjectId,
    connectedWalletAddress: input.ownerWalletAddress,
    approvedTreasuryObjectId: input.treasuryObjectId,
    packageId,
    coinType: serverConfig.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
  });
}
