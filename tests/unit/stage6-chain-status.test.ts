import { bcs } from "@mysten/sui/bcs";
import { toBase58 } from "@mysten/sui/utils";
import { describe, expect, it } from "vitest";
import { asMinorAmount } from "@/src/domain/money";
import { createSuiPaymentChainStatusProvider } from "@/src/lib/payments/chain-status";

const packageId =
  "0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f";
const coinType =
  "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC";
const treasury =
  "0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4";
const recipient =
  "0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560";
const digest = toBase58(new Uint8Array(32).fill(7));
const snapshot = {
  treasuryObjectId: treasury,
  categoryReference: "events",
  recipientSuiAddress: recipient,
  amountMinor: asMinorAmount(10),
  currency: "USDC" as const,
};

const payoutEventBcs = bcs.struct("PayoutEvent", {
  treasury_id: bcs.Address,
  category_reference: bcs.vector(bcs.u8()),
  recipient: bcs.Address,
  amount: bcs.u64(),
  category_remaining: bcs.u64(),
  treasury_balance: bcs.u64(),
});

describe("Sui payment chain status", () => {
  it("returns verified amounts only for a successful transaction with the exact payout event", async () => {
    const provider = createSuiPaymentChainStatusProvider(
      {
        getTransaction: async () => ({
          $kind: "Transaction" as const,
          Transaction: {
            digest,
            status: { success: true as const, error: null },
            timestampMs: 1_788_336_600_000,
            events: [validEvent()],
          },
        }),
      },
      { packageId, coinType },
    );

    await expect(provider.getStatus(digest, snapshot)).resolves.toEqual({
      state: "success",
      transactionDigest: digest,
      categoryRemainingMinor: 990,
      treasuryBalanceMinor: 990,
      confirmedAt: "2026-09-02T08:10:00.000Z",
    });
  });

  it("verifies canonical BCS even when grpc JSON rendering is unusable", async () => {
    const event = validEvent();
    event.json = {
      treasury_id: { bytes: treasury },
      category_reference: { bytes: "ZXZlbnRz" },
      recipient: { address: recipient },
      amount: { value: "100000" },
      category_remaining: { value: "9900000" },
      treasury_balance: { value: "9900000" },
    };
    const provider = createSuiPaymentChainStatusProvider(
      {
        getTransaction: async () => ({
          $kind: "Transaction" as const,
          Transaction: {
            digest,
            status: { success: true as const, error: null },
            timestampMs: 1_788_336_600_000,
            events: [event],
          },
        }),
      },
      { packageId, coinType },
    );

    await expect(provider.getStatus(digest, snapshot)).resolves.toEqual({
      state: "success",
      transactionDigest: digest,
      categoryRemainingMinor: 990,
      treasuryBalanceMinor: 990,
      confirmedAt: "2026-09-02T08:10:00.000Z",
    });
  });

  it("accepts the UTF-8 string representation Sui JSON may use for vector<u8>", async () => {
    const event = validEvent();
    event.bcs = new Uint8Array();
    event.json.category_reference = "events";
    const provider = createSuiPaymentChainStatusProvider(
      {
        getTransaction: async () => ({
          $kind: "Transaction" as const,
          Transaction: {
            digest,
            status: { success: true as const, error: null },
            timestampMs: 1_788_336_600_000,
            events: [event],
          },
        }),
      },
      { packageId, coinType },
    );

    await expect(provider.getStatus(digest, snapshot)).resolves.toEqual({
      state: "success",
      transactionDigest: digest,
      categoryRemainingMinor: 990,
      treasuryBalanceMinor: 990,
      confirmedAt: "2026-09-02T08:10:00.000Z",
    });
  });

  it("keeps a successful transaction with mismatched payout evidence non-terminal", async () => {
    const event = validEvent();
    event.bcs = payoutEventBcs
      .serialize({
        treasury_id: treasury,
        category_reference: [...new TextEncoder().encode("events")],
        recipient: treasury,
        amount: 100000n,
        category_remaining: 9900000n,
        treasury_balance: 9900000n,
      })
      .toBytes();
    event.json.recipient = treasury;
    const provider = createSuiPaymentChainStatusProvider(
      {
        getTransaction: async () => ({
          $kind: "Transaction" as const,
          Transaction: {
            digest,
            status: { success: true as const, error: null },
            timestampMs: 1_788_336_600_000,
            events: [event],
          },
        }),
      },
      { packageId, coinType },
    );

    await expect(provider.getStatus(digest, snapshot)).resolves.toEqual({
      state: "pending",
      code: "payout_event_verification_failed",
    });
  });

  it("distinguishes confirmed chain failure from an unavailable transaction", async () => {
    const failed = createSuiPaymentChainStatusProvider(
      {
        getTransaction: async () => ({
          $kind: "FailedTransaction" as const,
          FailedTransaction: {
            digest,
            status: { success: false as const, error: {} },
            timestampMs: null,
            events: [],
          },
        }),
      },
      { packageId, coinType },
    );
    const unavailable = createSuiPaymentChainStatusProvider(
      { getTransaction: async () => Promise.reject(new Error("not found")) },
      { packageId, coinType },
    );

    await expect(failed.getStatus(digest, snapshot)).resolves.toEqual({
      state: "failure",
      code: "chain_execution_failed",
    });
    await expect(unavailable.getStatus(digest, snapshot)).resolves.toEqual({
      state: "pending",
      code: "transaction_not_yet_confirmed",
    });
  });
});

function validEvent() {
  return {
    eventType: `${packageId}::treasury::PayoutEvent<${coinType}>`,
    bcs: payoutEventBcs
      .serialize({
        treasury_id: treasury,
        category_reference: [...new TextEncoder().encode("events")],
        recipient,
        amount: 100000n,
        category_remaining: 9900000n,
        treasury_balance: 9900000n,
      })
      .toBytes(),
    json: {
      treasury_id: treasury,
      category_reference: [...new TextEncoder().encode("events")],
      recipient,
      amount: "100000",
      category_remaining: "9900000",
      treasury_balance: "9900000",
    } as Record<string, unknown>,
  };
}
