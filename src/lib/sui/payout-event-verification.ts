import { bcs } from "@mysten/sui/bcs";
import {
  normalizeStructTag,
  normalizeSuiAddress,
  normalizeSuiObjectId,
} from "@mysten/sui/utils";
import type { MinorAmount } from "@/src/domain/money";
import type { ConfirmedTransaction } from "./execution";
import {
  appMinorToUsdcBaseUnits,
  nonnegativeUsdcBaseUnitsToAppMinor,
} from "./payment-safety";

export interface PayoutEventExpectation {
  packageId: string;
  coinType: string;
  treasuryObjectId: string;
  categoryReference: string;
  recipientSuiAddress: string;
  amountMinor: MinorAmount;
}

export interface VerifiedPayoutEvent {
  treasuryObjectId: string;
  categoryReference: string;
  recipientSuiAddress: string;
  amountBaseUnits: bigint;
  categoryRemainingBaseUnits: bigint;
  treasuryBalanceBaseUnits: bigint;
  categoryRemainingMinor: MinorAmount;
  treasuryBalanceMinor: MinorAmount;
}

const payoutEventBcs = bcs.struct("PayoutEvent", {
  treasury_id: bcs.Address,
  category_reference: bcs.vector(bcs.u8()),
  recipient: bcs.Address,
  amount: bcs.u64(),
  category_remaining: bcs.u64(),
  treasury_balance: bcs.u64(),
});

export function verifyPayoutEvent(
  transaction: Pick<ConfirmedTransaction, "events">,
  expected: PayoutEventExpectation,
): VerifiedPayoutEvent {
  const eventType = normalizeStructTag(
    `${normalizeSuiObjectId(expected.packageId)}::treasury::PayoutEvent<${expected.coinType}>`,
  );
  const matches = (transaction.events ?? []).filter((event) => {
    try {
      return normalizeStructTag(event.eventType) === eventType;
    } catch {
      return false;
    }
  });
  if (matches.length !== 1) {
    throw new Error(
      "Confirmed transaction must contain exactly one expected PayoutEvent.",
    );
  }

  const event = matches[0];
  const fields =
    event.bcs && event.bcs.byteLength > 0
      ? parseBcsPayoutEvent(event.bcs)
      : parseJsonPayoutEvent(event.json);

  const treasuryObjectId = normalizeRequiredObjectId(fields.treasury_id);
  const recipientSuiAddress = normalizeRequiredAddress(fields.recipient);
  const categoryReference = decodeCategoryReference(fields.category_reference);
  const amountBaseUnits = readU64(fields.amount, "amount");
  const categoryRemainingBaseUnits = readU64(
    fields.category_remaining,
    "category remaining",
  );
  const treasuryBalanceBaseUnits = readU64(
    fields.treasury_balance,
    "treasury balance",
  );

  if (treasuryObjectId !== normalizeSuiObjectId(expected.treasuryObjectId)) {
    throw new Error("PayoutEvent treasury does not match the approved payout.");
  }
  if (categoryReference !== expected.categoryReference) {
    throw new Error("PayoutEvent category does not match the approved payout.");
  }
  if (
    recipientSuiAddress !== normalizeSuiAddress(expected.recipientSuiAddress)
  ) {
    throw new Error("PayoutEvent recipient does not match the approved payout.");
  }
  if (amountBaseUnits !== appMinorToUsdcBaseUnits(expected.amountMinor)) {
    throw new Error("PayoutEvent amount does not match the approved payout.");
  }

  return {
    treasuryObjectId,
    categoryReference,
    recipientSuiAddress,
    amountBaseUnits,
    categoryRemainingBaseUnits,
    treasuryBalanceBaseUnits,
    categoryRemainingMinor: nonnegativeUsdcBaseUnitsToAppMinor(
      categoryRemainingBaseUnits,
    ),
    treasuryBalanceMinor: nonnegativeUsdcBaseUnitsToAppMinor(
      treasuryBalanceBaseUnits,
    ),
  };
}

function parseBcsPayoutEvent(bytes: Uint8Array): Record<string, unknown> {
  const parsed = payoutEventBcs.parse(bytes);
  return {
    treasury_id: parsed.treasury_id,
    category_reference: parsed.category_reference,
    recipient: parsed.recipient,
    amount: parsed.amount,
    category_remaining: parsed.category_remaining,
    treasury_balance: parsed.treasury_balance,
  };
}

function parseJsonPayoutEvent(value: Record<string, unknown> | null | undefined) {
  if (!value) throw new Error("PayoutEvent fields are missing.");
  return value;
}

function normalizeRequiredObjectId(value: unknown) {
  if (typeof value !== "string")
    throw new Error("PayoutEvent treasury is invalid.");
  return normalizeSuiObjectId(value);
}

function normalizeRequiredAddress(value: unknown) {
  if (typeof value !== "string")
    throw new Error("PayoutEvent recipient is invalid.");
  return normalizeSuiAddress(value);
}

function decodeCategoryReference(value: unknown) {
  if (typeof value === "string") return value;
  if (
    !Array.isArray(value) ||
    value.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)
  ) {
    throw new Error("PayoutEvent category reference is invalid.");
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(value as number[]),
  );
}

function readU64(value: unknown, label: string) {
  const normalized =
    typeof value === "bigint"
      ? value
      : typeof value === "number" && Number.isSafeInteger(value)
        ? BigInt(value)
        : typeof value === "string" && /^\d+$/.test(value)
          ? BigInt(value)
          : null;
  if (normalized === null || normalized < 0n || normalized > 2n ** 64n - 1n) {
    throw new Error(`PayoutEvent ${label} is not a valid u64.`);
  }
  return normalized;
}
