import { bcs } from "@mysten/sui/bcs";
import { normalizeSuiObjectId } from "@mysten/sui/utils";
import { asMinorAmount, type MinorAmount } from "@/src/domain/money";
import type {
  ApprovedPayoutSnapshot,
  PaymentAttempt,
} from "@/src/domain/stage6-payments";
import { appMinorToUsdcBaseUnits } from "@/src/lib/sui/payment-safety";

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

export interface PaymentPreflightPersistedState {
  attempt: PaymentAttempt;
  claim: {
    id: string;
    treasuryId: string;
    categoryId: string;
    status: string;
    decision: string | null;
    paymentStatus: string;
    approvedSnapshot: ApprovedPayoutSnapshot | null;
  };
  treasury: {
    id: string;
    suiTreasuryObjectId: string;
    suiTreasurerCapObjectId: string;
    suiActivationStatus: string;
    currency: string;
    status: string;
  };
  category: {
    id: string;
    treasuryId: string;
    externalReference: string;
    allocatedMinor: MinorAmount;
    spentMinor: MinorAmount;
  };
}

export interface PaymentPreflightRepository {
  loadPaymentPreflightState(
    attemptId: string,
  ): Promise<PaymentPreflightPersistedState | null>;
}

export interface SuiTreasuryState {
  objectId: string;
  type: string;
  allocationsConfirmed: boolean;
  custodyBaseUnits: bigint;
  categories: Array<{
    reference: string;
    allocatedBaseUnits: bigint;
    remainingBaseUnits: bigint;
  }>;
}

export interface PaymentPreflightTreasuryReader {
  readTreasury(objectId: string): Promise<SuiTreasuryState>;
}

export interface RawSuiTreasuryObject {
  requestedObjectId: string;
  expectedType: string;
  objectId: string;
  type: string;
  content: Uint8Array;
}

export function parseSuiTreasuryObject(
  input: RawSuiTreasuryObject,
): SuiTreasuryState {
  if (
    normalizeSuiObjectId(input.objectId) !==
    normalizeSuiObjectId(input.requestedObjectId)
  ) {
    throw new Error("Sui returned a different Treasury object ID.");
  }
  if (input.type !== input.expectedType) {
    throw new Error("Sui object is not the expected Treasury<USDC> type.");
  }

  let fields: ReturnType<typeof treasuryBcs.parse>;
  try {
    fields = treasuryBcs.parse(input.content);
  } catch (cause) {
    throw new Error("Sui Treasury BCS content is unreadable or incomplete.", {
      cause,
    });
  }
  if (
    normalizeSuiObjectId(fields.id.id) !== normalizeSuiObjectId(input.objectId)
  ) {
    throw new Error("Sui Treasury content has a different object ID.");
  }
  if (!fields.allocations_confirmed) {
    throw new Error("Sui Treasury category allocations are not confirmed.");
  }
  if (
    fields.category_references.length === 0 ||
    fields.category_references.length !== fields.category_allocated.length ||
    fields.category_references.length !== fields.category_remaining.length
  ) {
    throw new Error("Sui Treasury category data is incomplete.");
  }

  const decoder = new TextDecoder("utf-8", { fatal: true });
  const categories = fields.category_references.map((reference, index) => {
    let decoded: string;
    try {
      decoded = decoder.decode(Uint8Array.from(reference));
    } catch (cause) {
      throw new Error("Sui Treasury category reference is not valid UTF-8.", {
        cause,
      });
    }
    if (!decoded.trim()) {
      throw new Error("Sui Treasury category reference is empty.");
    }
    const allocatedBaseUnits = BigInt(fields.category_allocated[index]);
    const remainingBaseUnits = BigInt(fields.category_remaining[index]);
    if (remainingBaseUnits > allocatedBaseUnits) {
      throw new Error("Sui Treasury category accounting is invalid.");
    }
    return { reference: decoded, allocatedBaseUnits, remainingBaseUnits };
  });

  return {
    objectId: normalizeSuiObjectId(input.objectId),
    type: input.type,
    allocationsConfirmed: true,
    custodyBaseUnits: BigInt(fields.funds.value),
    categories,
  };
}

export async function preflightPaymentAttempt(
  repository: PaymentPreflightRepository,
  reader: PaymentPreflightTreasuryReader,
  config: { packageId: string; coinType: string },
  attemptId: string,
) {
  let persisted: PaymentPreflightPersistedState | null;
  try {
    persisted = await repository.loadPaymentPreflightState(attemptId);
  } catch (cause) {
    const detail =
      cause instanceof Error ? cause.message : "state is unreadable";
    fail(`persisted payment state is unreadable: ${detail}`);
  }
  if (!persisted) fail("payment attempt or related persisted state is missing");
  const { attempt, claim, treasury, category } = persisted;

  if (attempt.id !== attemptId || attempt.claimId !== claim.id) {
    fail("payment attempt is not related to the approved claim");
  }
  if (attempt.transactionDigest) {
    fail("attempt has an existing digest and must use reconciliation");
  }
  if (
    attempt.status !== "prepared" ||
    claim.status !== "approved_unpaid" ||
    claim.decision !== "approve" ||
    claim.paymentStatus !== "unpaid" ||
    !claim.approvedSnapshot
  ) {
    fail("claim and payment attempt are no longer eligible");
  }
  assertSameSnapshot(attempt.snapshot, claim.approvedSnapshot);
  if (
    claim.treasuryId !== treasury.id ||
    claim.categoryId !== category.id ||
    category.treasuryId !== treasury.id
  ) {
    fail("persisted claim, Treasury, and category relations are invalid");
  }
  if (
    treasury.currency !== "USDC" ||
    treasury.status !== "active" ||
    treasury.suiActivationStatus !== "active" ||
    !normalizeForPreflight(
      treasury.suiTreasurerCapObjectId,
      "workspace TreasurerCap ID",
    ) ||
    normalizeForPreflight(
      treasury.suiTreasuryObjectId,
      "persisted Treasury ID",
    ) !==
      normalizeForPreflight(
        attempt.snapshot.treasuryObjectId,
        "approved Treasury ID",
      )
  ) {
    fail("persisted Treasury does not match the approved Treasury");
  }
  if (category.externalReference !== attempt.snapshot.categoryReference) {
    fail("persisted category does not match the approved category");
  }
  if (
    !Number.isSafeInteger(category.allocatedMinor) ||
    !Number.isSafeInteger(category.spentMinor) ||
    category.allocatedMinor < 0 ||
    category.spentMinor < 0 ||
    category.spentMinor > category.allocatedMinor
  ) {
    fail("persisted category remaining is invalid");
  }
  const persistedRemaining = asMinorAmount(
    category.allocatedMinor - category.spentMinor,
  );
  if (
    !Number.isSafeInteger(attempt.snapshot.amountMinor) ||
    attempt.snapshot.amountMinor <= 0
  ) {
    fail("approved amount must be a positive safe integer");
  }
  if (attempt.snapshot.amountMinor > persistedRemaining) {
    fail("approved amount exceeds persisted category remaining");
  }

  let chain: SuiTreasuryState;
  try {
    chain = await reader.readTreasury(attempt.snapshot.treasuryObjectId);
  } catch (cause) {
    const detail =
      cause instanceof Error ? cause.message : "state is unreadable";
    fail(`Sui Treasury state is unreadable: ${detail}`);
  }
  const expectedType = `${normalizeForPreflight(config.packageId, "configured package ID")}::treasury::Treasury<${config.coinType}>`;
  if (
    normalizeForPreflight(chain.objectId, "Sui Treasury ID") !==
      normalizeForPreflight(
        attempt.snapshot.treasuryObjectId,
        "approved Treasury ID",
      ) ||
    chain.type !== expectedType ||
    !chain.allocationsConfirmed
  ) {
    fail("Sui object is not the expected confirmed Treasury<USDC>");
  }
  const matches = chain.categories.filter(
    (candidate) => candidate.reference === attempt.snapshot.categoryReference,
  );
  if (matches.length !== 1) {
    fail("approved category must appear exactly once in the Sui Treasury");
  }
  const categoryOnChain = matches[0];
  const expectedRemainingBaseUnits =
    appMinorToUsdcBaseUnits(persistedRemaining);
  if (categoryOnChain.remainingBaseUnits !== expectedRemainingBaseUnits) {
    fail("persisted and Sui category remaining differ");
  }
  const totalRemaining = chain.categories.reduce(
    (sum, candidate) => sum + candidate.remainingBaseUnits,
    0n,
  );
  if (
    chain.custodyBaseUnits < 0n ||
    totalRemaining !== chain.custodyBaseUnits
  ) {
    fail(
      "Sui Treasury custody and category accounting are not internally consistent",
    );
  }
  const amountBaseUnits = appMinorToUsdcBaseUnits(attempt.snapshot.amountMinor);
  if (amountBaseUnits > categoryOnChain.remainingBaseUnits) {
    fail("approved amount exceeds Sui category remaining");
  }
  if (amountBaseUnits > chain.custodyBaseUnits) {
    fail("approved amount exceeds current Sui Treasury custody");
  }
  return { ok: true as const };
}

function assertSameSnapshot(
  attempt: ApprovedPayoutSnapshot,
  approved: ApprovedPayoutSnapshot,
) {
  if (
    normalizeForPreflight(attempt.treasuryObjectId, "attempt Treasury ID") !==
      normalizeForPreflight(
        approved.treasuryObjectId,
        "approved Treasury ID",
      ) ||
    attempt.categoryReference !== approved.categoryReference ||
    normalizeForPreflight(attempt.recipientSuiAddress, "attempt recipient") !==
      normalizeForPreflight(
        approved.recipientSuiAddress,
        "approved recipient",
      ) ||
    attempt.amountMinor !== approved.amountMinor ||
    attempt.currency !== approved.currency
  ) {
    fail("immutable payment attempt does not match the approved snapshot");
  }
}

function normalizeForPreflight(value: string, label: string) {
  try {
    return normalizeSuiObjectId(value);
  } catch {
    fail(`${label} is invalid`);
  }
}

function fail(detail: string): never {
  throw new Error(
    `Payout consistency check failed: ${detail}. Refresh authoritative Treasury data before retrying.`,
  );
}
