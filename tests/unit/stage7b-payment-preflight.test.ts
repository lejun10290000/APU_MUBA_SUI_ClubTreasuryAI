import { bcs } from "@mysten/sui/bcs";
import { describe, expect, it, vi } from "vitest";
import { asMinorAmount } from "@/src/domain/money";
import type { PaymentAttempt } from "@/src/domain/stage6-payments";
import {
  parseSuiTreasuryObject,
  preflightPaymentAttempt,
  type PaymentPreflightPersistedState,
} from "@/src/lib/payments/preflight";

const packageId = `0x${"1".repeat(64)}`;
const treasuryObjectId = `0x${"2".repeat(64)}`;
const otherTreasuryObjectId = `0x${"3".repeat(64)}`;
const coinType = `0x${"4".repeat(64)}::usdc::USDC`;
const claimId = "10000000-0000-4000-8000-000000000001";
const attemptId = "20000000-0000-4000-8000-000000000002";

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

describe("Stage 7B Sui Treasury parser", () => {
  it("parses the known Treasury<USDC> BCS layout exactly", () => {
    expect(parseSuiTreasuryObject(suiObject())).toEqual({
      objectId: treasuryObjectId,
      type: `${packageId}::treasury::Treasury<${coinType}>`,
      allocationsConfirmed: true,
      custodyBaseUnits: 90_000_000n,
      categories: [
        {
          reference: "marketing",
          allocatedBaseUnits: 100_000_000n,
          remainingBaseUnits: 90_000_000n,
        },
      ],
    });
  });

  it("rejects the wrong object ID or Treasury asset type", () => {
    expect(() =>
      parseSuiTreasuryObject({
        ...suiObject(),
        objectId: otherTreasuryObjectId,
      }),
    ).toThrow(/object ID/i);
    expect(() =>
      parseSuiTreasuryObject({
        ...suiObject(),
        type: `${packageId}::treasury::Treasury<0x2::sui::SUI>`,
      }),
    ).toThrow(/Treasury<USDC>/i);
  });

  it("fails closed for unconfirmed, incomplete, or invalid UTF-8 category data", () => {
    expect(() =>
      parseSuiTreasuryObject(suiObject({ confirmed: false })),
    ).toThrow(/not confirmed/i);
    expect(() => parseSuiTreasuryObject(suiObject({ remaining: [] }))).toThrow(
      /incomplete/i,
    );
    expect(() =>
      parseSuiTreasuryObject(suiObject({ references: [[255]] })),
    ).toThrow(/UTF-8/i);
  });
});

describe("Stage 7B payment preflight consistency", () => {
  it("accepts only a fully aligned prepared attempt", async () => {
    await expect(run()).resolves.toEqual({ ok: true });
  });

  it("rejects a persisted Treasury or category that differs from approval", async () => {
    await expect(
      run({ treasury: { suiTreasuryObjectId: otherTreasuryObjectId } }),
    ).rejects.toThrow(/persisted Treasury.*approved Treasury/i);
    await expect(
      run({ category: { externalReference: "travel" } }),
    ).rejects.toThrow(/persisted category.*approved category/i);
  });

  it("rejects missing or duplicate Sui categories", async () => {
    await expect(run({}, { references: [bytes("travel")] })).rejects.toThrow(
      /exactly once/i,
    );
    await expect(
      run(
        {},
        {
          references: [bytes("marketing"), bytes("marketing")],
          allocated: [100_000_000n, 1n],
          remaining: [90_000_000n, 0n],
        },
      ),
    ).rejects.toThrow(/exactly once/i);
  });

  it("rejects exact remaining mismatches", async () => {
    await expect(run({}, { remaining: [89_999_999n] })).rejects.toThrow(
      /remaining differ/i,
    );
  });

  it("rejects invalid or insufficient approved amounts and custody", async () => {
    await expect(run({ amountMinor: 0 })).rejects.toThrow(/positive/i);
    await expect(run({ amountMinor: 9_001 })).rejects.toThrow(
      /persisted category remaining/i,
    );
    await expect(run({}, { custody: 20_000_000n })).rejects.toThrow(
      /internally consistent|custody/i,
    );
  });

  it("never reads Sui for a digest-bearing attempt", async () => {
    const reader = { readTreasury: vi.fn() };
    await expect(
      preflightPaymentAttempt(
        repository(
          persisted({ transactionDigest: "digest-already-signed-12345" }),
        ),
        reader,
        {
          packageId,
          coinType,
        },
        attemptId,
      ),
    ).rejects.toThrow(/existing digest.*reconciliation/i);
    expect(reader.readTreasury).not.toHaveBeenCalled();
  });
});

function run(
  persistedOverride: PersistedOverrides = {},
  chainOverride: ChainOverrides = {},
) {
  const state = persisted(persistedOverride);
  return preflightPaymentAttempt(
    repository(state),
    {
      readTreasury: vi
        .fn()
        .mockResolvedValue(parseSuiTreasuryObject(suiObject(chainOverride))),
    },
    { packageId, coinType },
    attemptId,
  );
}

function repository(state: PaymentPreflightPersistedState) {
  return { loadPaymentPreflightState: vi.fn().mockResolvedValue(state) };
}

type PersistedOverrides = {
  transactionDigest?: string;
  amountMinor?: number;
  treasury?: { suiTreasuryObjectId: string };
  category?: { externalReference: string };
};

function persisted(
  overrides: PersistedOverrides = {},
): PaymentPreflightPersistedState {
  const amountMinor = asMinorAmount(overrides.amountMinor ?? 2_500);
  const attempt: PaymentAttempt = {
    id: attemptId,
    claimId,
    initiatedByUserId: "30000000-0000-4000-8000-000000000003",
    snapshot: {
      treasuryObjectId,
      categoryReference: "marketing",
      recipientSuiAddress: otherTreasuryObjectId,
      amountMinor,
      currency: "USDC",
    },
    treasurerCapObjectId: null,
    transactionDigest: overrides.transactionDigest ?? null,
    status: "prepared",
    failureCode: null,
    createdAt: "2026-09-03T00:00:00.000Z",
    updatedAt: "2026-09-03T00:00:00.000Z",
    confirmedAt: null,
  };
  return {
    attempt,
    claim: {
      id: claimId,
      treasuryId: "40000000-0000-4000-8000-000000000004",
      categoryId: "50000000-0000-4000-8000-000000000005",
      status: "approved_unpaid",
      decision: "approve",
      paymentStatus: "unpaid",
      approvedSnapshot: attempt.snapshot,
    },
    treasury: {
      id: "40000000-0000-4000-8000-000000000004",
      suiTreasuryObjectId:
        overrides.treasury?.suiTreasuryObjectId ?? treasuryObjectId,
      currency: "USDC",
      status: "active",
    },
    category: {
      id: "50000000-0000-4000-8000-000000000005",
      treasuryId: "40000000-0000-4000-8000-000000000004",
      externalReference: overrides.category?.externalReference ?? "marketing",
      allocatedMinor: asMinorAmount(10_000),
      spentMinor: asMinorAmount(1_000),
    },
  };
}

type ChainOverrides = {
  confirmed?: boolean;
  custody?: bigint;
  references?: number[][];
  allocated?: bigint[];
  remaining?: bigint[];
};

function suiObject(overrides: ChainOverrides = {}) {
  const references = overrides.references ?? [bytes("marketing")];
  const allocated = overrides.allocated ?? [100_000_000n];
  const remaining = overrides.remaining ?? [90_000_000n];
  return {
    requestedObjectId: treasuryObjectId,
    expectedType: `${packageId}::treasury::Treasury<${coinType}>`,
    objectId: treasuryObjectId,
    type: `${packageId}::treasury::Treasury<${coinType}>`,
    content: treasuryBcs
      .serialize({
        id: { id: treasuryObjectId },
        treasurer: otherTreasuryObjectId,
        external_reference: bytes("stage7-demo"),
        metadata_revision: 1n,
        funds: { value: overrides.custody ?? 90_000_000n },
        category_references: references,
        category_allocated: allocated,
        category_remaining: remaining,
        allocations_confirmed: overrides.confirmed ?? true,
      })
      .toBytes(),
  };
}

function bytes(value: string) {
  return [...new TextEncoder().encode(value)];
}
