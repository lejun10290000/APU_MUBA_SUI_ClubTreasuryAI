import { normalizeSuiAddress, normalizeSuiObjectId } from "@mysten/sui/utils";
import { bcs } from "@mysten/sui/bcs";

export type ActivationMoveCall = {
  packageId: string;
  module: string;
  function: string;
  typeArguments: readonly string[];
  objectIds?: readonly string[];
};

export type ActivationTransactionEvidence = {
  digest: string;
  success: boolean;
  checkpointed: boolean;
  sender: string;
  moveCalls: readonly ActivationMoveCall[];
  createdObjects: readonly { objectId: string; type: string }[];
};

export type ActivationTreasuryEvidence = {
  objectId: string;
  treasurerAddress: string;
  externalReference: string;
  custodyAtomic: bigint;
  allocationsConfirmed: boolean;
  categories: readonly {
    reference: string;
    allocatedAtomic: bigint;
    remainingAtomic: bigint;
  }[];
};

type CommonExpectation = {
  digest: string;
  ownerWalletAddress: string;
  packageId: string;
  coinType: string;
};

export class ActivationReconciliationRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivationReconciliationRequiredError";
  }
}

export class ActivationExecutionFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivationExecutionFailedError";
  }
}

const treasuryBcs = bcs.struct("Treasury", {
  id: bcs.struct("UID", { id: bcs.Address }),
  treasurer: bcs.Address,
  external_reference: bcs.vector(bcs.u8()),
  metadata_revision: bcs.u64(),
  funds: bcs.struct("Balance", { value: bcs.u64() }),
  category_references: bcs.vector(bcs.vector(bcs.u8())),
  category_allocated: bcs.vector(bcs.u64()),
  category_remaining: bcs.vector(bcs.u64()),
  allocations_confirmed: bcs.bool(),
});

export function parseActivationTreasuryObject(input: {
  requestedObjectId: string;
  expectedType: string;
  objectId: string;
  type: string;
  content: Uint8Array;
}): ActivationTreasuryEvidence {
  if (
    normalizeSuiObjectId(input.objectId) !==
      normalizeSuiObjectId(input.requestedObjectId) ||
    input.type !== input.expectedType
  ) {
    throw new Error("Sui object is not the expected Treasury<USDC>.");
  }
  const fields = treasuryBcs.parse(input.content);
  if (normalizeSuiObjectId(fields.id.id) !== normalizeSuiObjectId(input.objectId)) {
    throw new Error("Sui Treasury content has a different object ID.");
  }
  if (
    fields.category_references.length !== fields.category_allocated.length ||
    fields.category_references.length !== fields.category_remaining.length
  ) {
    throw new Error("Sui Treasury category vectors are inconsistent.");
  }
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return {
    objectId: normalizeSuiObjectId(input.objectId),
    treasurerAddress: normalizeSuiAddress(fields.treasurer),
    externalReference: decoder.decode(Uint8Array.from(fields.external_reference)),
    custodyAtomic: BigInt(fields.funds.value),
    allocationsConfirmed: fields.allocations_confirmed,
    categories: fields.category_references.map((reference, index) => ({
      reference: decoder.decode(Uint8Array.from(reference)),
      allocatedAtomic: BigInt(fields.category_allocated[index]!),
      remainingAtomic: BigInt(fields.category_remaining[index]!),
    })),
  };
}

export function verifyCreatedTreasuryState(
  treasury: ActivationTreasuryEvidence,
  expected: {
    treasuryObjectId: string;
    ownerWalletAddress: string;
    externalReference: string;
  },
): void {
  if (
    normalizeSuiObjectId(treasury.objectId) !==
      normalizeSuiObjectId(expected.treasuryObjectId) ||
    normalizeSuiAddress(treasury.treasurerAddress) !==
      normalizeSuiAddress(expected.ownerWalletAddress) ||
    treasury.externalReference !== expected.externalReference ||
    treasury.custodyAtomic !== 0n ||
    treasury.allocationsConfirmed ||
    treasury.categories.length !== 0
  ) {
    throw new ActivationReconciliationRequiredError(
      "Created Treasury state does not match the workspace activation snapshot.",
    );
  }
}

function requireVerifiedTransaction(
  transaction: ActivationTransactionEvidence,
  expected: CommonExpectation,
  functionName: string,
) {
  if (!transaction.success) {
    throw new ActivationExecutionFailedError("Sui reported transaction failure.");
  }
  if (!transaction.checkpointed) {
    throw new ActivationReconciliationRequiredError(
      "Transaction is not checkpointed yet.",
    );
  }
  if (transaction.digest !== expected.digest) {
    throw new ActivationReconciliationRequiredError(
      "Confirmed evidence does not match the saved digest.",
    );
  }
  if (
    normalizeSuiAddress(transaction.sender) !==
    normalizeSuiAddress(expected.ownerWalletAddress)
  ) {
    throw new ActivationReconciliationRequiredError(
      "Transaction sender does not match the verified workspace owner.",
    );
  }
  const call = transaction.moveCalls.find(
    (candidate) =>
      normalizeSuiObjectId(candidate.packageId) ===
        normalizeSuiObjectId(expected.packageId) &&
      candidate.module === "treasury" &&
      candidate.function === functionName &&
      candidate.typeArguments.length === 1 &&
      candidate.typeArguments[0] === expected.coinType,
  );
  if (!call) {
    throw new ActivationReconciliationRequiredError(
      `Expected treasury::${functionName} call could not be verified.`,
    );
  }
}

export function verifyCreateActivation(
  transaction: ActivationTransactionEvidence,
  expected: CommonExpectation,
) {
  requireVerifiedTransaction(transaction, expected, "create");
  const treasuryType = `${normalizeSuiObjectId(expected.packageId)}::treasury::Treasury<${expected.coinType}>`;
  const capType = `${normalizeSuiObjectId(expected.packageId)}::treasury::TreasurerCap<${expected.coinType}>`;
  const treasuries = transaction.createdObjects.filter(
    (object) => object.type === treasuryType,
  );
  const caps = transaction.createdObjects.filter((object) => object.type === capType);
  if (treasuries.length !== 1 || caps.length !== 1) {
    throw new ActivationReconciliationRequiredError(
      "The exact created Treasury and TreasurerCap could not be verified.",
    );
  }
  return {
    treasuryObjectId: normalizeSuiObjectId(treasuries[0]!.objectId),
    treasurerCapObjectId: normalizeSuiObjectId(caps[0]!.objectId),
  };
}

export function verifyFundActivation(
  transaction: ActivationTransactionEvidence,
  expected: CommonExpectation & {
    expectedBudgetAtomic: bigint;
    treasuryObjectId?: string;
    treasury: ActivationTreasuryEvidence;
  },
): void {
  requireVerifiedTransaction(transaction, expected, "deposit");
  const depositCall = transaction.moveCalls.find(
    (call) => call.module === "treasury" && call.function === "deposit",
  );
  if (
    expected.treasuryObjectId &&
    !depositCall?.objectIds?.some(
      (id) => normalizeSuiObjectId(id) === normalizeSuiObjectId(expected.treasuryObjectId!),
    )
  ) {
    throw new ActivationReconciliationRequiredError(
      "Funding did not target the verified workspace Treasury.",
    );
  }
  if (
    expected.treasury.allocationsConfirmed ||
    expected.treasury.custodyAtomic !== expected.expectedBudgetAtomic
  ) {
    throw new ActivationReconciliationRequiredError(
      "Treasury funding does not exactly match the frozen workspace budget.",
    );
  }
}

export function verifyAllocationActivation(
  transaction: ActivationTransactionEvidence,
  expected: CommonExpectation & {
    treasury: ActivationTreasuryEvidence;
    treasuryObjectId?: string;
    treasurerCapObjectId?: string;
    expectedCategories: readonly { reference: string; allocatedAtomic: bigint }[];
  },
): void {
  requireVerifiedTransaction(transaction, expected, "confirm_allocations");
  const allocationCall = transaction.moveCalls.find(
    (call) => call.module === "treasury" && call.function === "confirm_allocations",
  );
  for (const expectedObjectId of [
    expected.treasuryObjectId,
    expected.treasurerCapObjectId,
  ]) {
    if (
      expectedObjectId &&
      !allocationCall?.objectIds?.some(
        (id) => normalizeSuiObjectId(id) === normalizeSuiObjectId(expectedObjectId),
      )
    ) {
      throw new ActivationReconciliationRequiredError(
        "Allocation did not use the verified workspace Treasury and TreasurerCap.",
      );
    }
  }
  const actual = expected.treasury.categories;
  const categoriesMatch =
    expected.treasury.allocationsConfirmed &&
    actual.length === expected.expectedCategories.length &&
    actual.every((category, index) => {
      const wanted = expected.expectedCategories[index];
      return (
        wanted?.reference === category.reference &&
        wanted.allocatedAtomic === category.allocatedAtomic &&
        category.remainingAtomic === category.allocatedAtomic
      );
    });
  const expectedTotal = expected.expectedCategories.reduce(
    (total, category) => total + category.allocatedAtomic,
    0n,
  );
  if (!categoriesMatch || expected.treasury.custodyAtomic !== expectedTotal) {
    throw new ActivationReconciliationRequiredError(
      "On-chain allocations do not exactly match the frozen workspace budget.",
    );
  }
}
