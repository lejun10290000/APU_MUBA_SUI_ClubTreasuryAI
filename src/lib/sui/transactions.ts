import { Transaction } from "@mysten/sui/transactions";
import {
  isValidSuiAddress,
  isValidSuiObjectId,
  normalizeSuiAddress,
} from "@mysten/sui/utils";
import type { SuiDeploymentConfig } from "./deployment";
import { requirePackageId } from "./deployment";
import { SuiIntegrationError } from "./errors";

const U64_MAX = 18_446_744_073_709_551_615n;
const ZERO_ADDRESS = normalizeSuiAddress("0x0");
const encoder = new TextEncoder();

export type CreateTreasuryInput = {
  externalReference: string;
};

export type FundTreasuryInput = {
  treasuryId: string;
  sourceCoinId: string;
  amount: bigint;
};

export type ConfirmAllocationsInput = {
  treasuryId: string;
  treasurerCapId: string;
  categoryReferences: readonly string[];
  allocations: readonly bigint[];
};

export type PayoutInput = {
  treasuryId: string;
  treasurerCapId: string;
  categoryReference: string;
  recipient: string;
  amount: bigint;
};

function target(packageId: string, fn: string) {
  return `${packageId}::treasury::${fn}`;
}

function referenceBytes(reference: string, field: string) {
  const bytes = encoder.encode(reference);
  if (bytes.length === 0) {
    throw new SuiIntegrationError(
      "EMPTY_REFERENCE",
      `${field} must not be empty.`,
    );
  }
  return [...bytes];
}

function objectId(value: string, field: string) {
  if (!isValidSuiObjectId(value)) {
    throw new SuiIntegrationError(
      "INVALID_OBJECT_ID",
      `${field} must be a valid Sui object ID.`,
    );
  }
  return value;
}

function u64(value: bigint, field: string) {
  if (typeof value !== "bigint" || value <= 0n || value > U64_MAX) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      `${field} must be a positive u64 bigint.`,
    );
  }
  return value;
}

export function buildCreateTreasuryTransaction(
  config: SuiDeploymentConfig,
  input: CreateTreasuryInput,
) {
  const packageId = requirePackageId(config);
  const transaction = new Transaction();
  transaction.moveCall({
    target: target(packageId, "create"),
    typeArguments: [config.usdcCoinType],
    arguments: [
      transaction.pure.vector(
        "u8",
        referenceBytes(input.externalReference, "External reference"),
      ),
    ],
  });
  return transaction;
}

export function buildFundTreasuryTransaction(
  config: SuiDeploymentConfig,
  input: FundTreasuryInput,
) {
  const packageId = requirePackageId(config);
  const treasuryId = objectId(input.treasuryId, "Treasury ID");
  const sourceCoinId = objectId(input.sourceCoinId, "Source coin ID");
  const amount = u64(input.amount, "Deposit amount");
  const transaction = new Transaction();
  const [payment] = transaction.splitCoins(transaction.object(sourceCoinId), [
    amount,
  ]);
  transaction.moveCall({
    target: target(packageId, "deposit"),
    typeArguments: [config.usdcCoinType],
    arguments: [transaction.object(treasuryId), payment],
  });
  return transaction;
}

export function buildConfirmAllocationsTransaction(
  config: SuiDeploymentConfig,
  input: ConfirmAllocationsInput,
) {
  const packageId = requirePackageId(config);
  const treasuryId = objectId(input.treasuryId, "Treasury ID");
  const treasurerCapId = objectId(input.treasurerCapId, "TreasurerCap ID");

  if (input.categoryReferences.length === 0) {
    throw new SuiIntegrationError(
      "EMPTY_REFERENCE",
      "At least one category reference is required.",
    );
  }
  if (input.categoryReferences.length !== input.allocations.length) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      "Category references and allocations must have matching lengths.",
    );
  }
  if (
    new Set(input.categoryReferences).size !== input.categoryReferences.length
  ) {
    throw new SuiIntegrationError(
      "DUPLICATE_CATEGORY_REFERENCE",
      "Category references must be unique.",
    );
  }

  const references = input.categoryReferences.map((reference) =>
    referenceBytes(reference, "Category reference"),
  );
  const allocations = input.allocations.map((amount) =>
    u64(amount, "Category allocation"),
  );
  const transaction = new Transaction();
  transaction.moveCall({
    target: target(packageId, "confirm_allocations"),
    typeArguments: [config.usdcCoinType],
    arguments: [
      transaction.object(treasuryId),
      transaction.object(treasurerCapId),
      transaction.pure.vector("vector<u8>", references),
      transaction.pure.vector("u64", allocations),
    ],
  });
  return transaction;
}

export function buildPayoutTransaction(
  config: SuiDeploymentConfig,
  input: PayoutInput,
) {
  const packageId = requirePackageId(config);
  const treasuryId = objectId(input.treasuryId, "Treasury ID");
  const treasurerCapId = objectId(input.treasurerCapId, "TreasurerCap ID");
  if (!isValidSuiAddress(input.recipient) || input.recipient === ZERO_ADDRESS) {
    throw new SuiIntegrationError(
      "INVALID_RECIPIENT",
      "Recipient must be a valid non-zero Sui address.",
    );
  }
  const amount = u64(input.amount, "Payout amount");
  const transaction = new Transaction();
  transaction.moveCall({
    target: target(packageId, "payout"),
    typeArguments: [config.usdcCoinType],
    arguments: [
      transaction.object(treasuryId),
      transaction.object(treasurerCapId),
      transaction.pure.vector(
        "u8",
        referenceBytes(input.categoryReference, "Category reference"),
      ),
      transaction.pure.address(input.recipient),
      transaction.pure.u64(amount),
    ],
  });
  return transaction;
}
