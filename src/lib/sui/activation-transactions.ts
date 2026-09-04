import { Transaction } from "@mysten/sui/transactions";
import { isValidSuiObjectId } from "@mysten/sui/utils";

import type { SuiDeploymentConfig } from "@/src/lib/sui/deployment";
import { requirePackageId } from "@/src/lib/sui/deployment";
import { SuiIntegrationError } from "@/src/lib/sui/errors";
import {
  buildConfirmAllocationsTransaction,
  buildCreateTreasuryTransaction,
  type ConfirmAllocationsInput,
  type CreateTreasuryInput,
} from "@/src/lib/sui/transactions";

const U64_MAX = 18_446_744_073_709_551_615n;

export function buildActivationCreateTransaction(
  config: SuiDeploymentConfig,
  input: CreateTreasuryInput,
) {
  return buildCreateTreasuryTransaction(config, input);
}

export function buildActivationFundTransaction(
  config: SuiDeploymentConfig,
  input: {
    treasuryId: string;
    sourceCoinIds: readonly string[];
    amountAtomic: bigint;
  },
) {
  const packageId = requirePackageId(config);
  if (!isValidSuiObjectId(input.treasuryId)) {
    throw new SuiIntegrationError(
      "INVALID_OBJECT_ID",
      "Treasury ID must be a valid Sui object ID.",
    );
  }
  if (input.sourceCoinIds.length === 0) {
    throw new SuiIntegrationError(
      "INVALID_OBJECT_ID",
      "At least one USDC coin is required.",
    );
  }
  if (input.sourceCoinIds.some((id) => !isValidSuiObjectId(id))) {
    throw new SuiIntegrationError(
      "INVALID_OBJECT_ID",
      "Every source coin must be a valid Sui object ID.",
    );
  }
  if (input.amountAtomic <= 0n || input.amountAtomic > U64_MAX) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      "Deposit amount must be a positive u64 bigint.",
    );
  }

  const transaction = new Transaction();
  const primary = transaction.object(input.sourceCoinIds[0]!);
  if (input.sourceCoinIds.length > 1) {
    transaction.mergeCoins(
      primary,
      input.sourceCoinIds.slice(1).map((id) => transaction.object(id)),
    );
  }
  const [depositCoin] = transaction.splitCoins(primary, [
    transaction.pure.u64(input.amountAtomic),
  ]);
  transaction.moveCall({
    target: `${packageId}::treasury::deposit`,
    typeArguments: [config.usdcCoinType],
    arguments: [transaction.object(input.treasuryId), depositCoin!],
  });
  return transaction;
}

export function buildActivationAllocationTransaction(
  config: SuiDeploymentConfig,
  input: ConfirmAllocationsInput,
) {
  return buildConfirmAllocationsTransaction(config, input);
}
