import { Transaction } from "@mysten/sui/transactions";
import { toBase58 } from "@mysten/sui/utils";
import { describe, expect, it, vi } from "vitest";
import {
  executeAndConfirmTestnetTransaction,
  getCreatedTreasuryObjects,
  testnetExplorerTransactionUrl,
} from "@/src/lib/sui/execution";

const digest = toBase58(new Uint8Array(32).fill(7));
const transaction = new Transaction();

function succeeded(overrides = {}) {
  return {
    digest,
    status: { success: true as const, error: null },
    ...overrides,
  };
}

describe("explicit Sui Testnet execution", () => {
  it("signs once and returns only after a successful confirmation", async () => {
    const signAndExecuteTransaction = vi.fn().mockResolvedValue({
      $kind: "Transaction",
      Transaction: succeeded(),
    });
    const waitForTransaction = vi.fn().mockResolvedValue({
      $kind: "Transaction",
      Transaction: succeeded(),
    });

    await expect(
      executeAndConfirmTestnetTransaction({
        transaction,
        executor: { signAndExecuteTransaction },
        client: { waitForTransaction },
        connected: true,
        network: "testnet",
      }),
    ).resolves.toMatchObject({ digest });
    expect(signAndExecuteTransaction).toHaveBeenCalledTimes(1);
    expect(waitForTransaction).toHaveBeenCalledWith({
      digest,
      include: { effects: true, events: true, objectTypes: true },
    });
  });

  it("never opens the wallet when the connection boundary fails", async () => {
    const signAndExecuteTransaction = vi.fn();
    await expect(
      executeAndConfirmTestnetTransaction({
        transaction,
        executor: { signAndExecuteTransaction },
        client: { waitForTransaction: vi.fn() },
        connected: false,
        network: null,
      }),
    ).rejects.toMatchObject({ code: "WALLET_NOT_CONNECTED" });
    expect(signAndExecuteTransaction).not.toHaveBeenCalled();
  });

  it("distinguishes rejection and refuses unconfirmed success", async () => {
    await expect(
      executeAndConfirmTestnetTransaction({
        transaction,
        executor: {
          signAndExecuteTransaction: vi
            .fn()
            .mockRejectedValue(new Error("rejected")),
        },
        client: { waitForTransaction: vi.fn() },
        connected: true,
        network: "testnet",
      }),
    ).rejects.toMatchObject({ code: "TRANSACTION_REJECTED", source: "wallet" });

    await expect(
      executeAndConfirmTestnetTransaction({
        transaction,
        executor: {
          signAndExecuteTransaction: vi.fn().mockResolvedValue({
            $kind: "Transaction",
            Transaction: succeeded(),
          }),
        },
        client: {
          waitForTransaction: vi
            .fn()
            .mockRejectedValue(new Error("RPC unavailable")),
        },
        connected: true,
        network: "testnet",
      }),
    ).rejects.toMatchObject({ code: "TRANSACTION_CONFIRMATION_FAILED" });
  });

  it("extracts only created Treasury and TreasurerCap types", () => {
    const packageId = `0x${"1".repeat(64)}`;
    const treasuryId = `0x${"2".repeat(64)}`;
    const capId = `0x${"3".repeat(64)}`;
    expect(
      getCreatedTreasuryObjects(
        succeeded({
          effects: {
            changedObjects: [treasuryId, capId].map((objectId) => ({
              objectId,
              idOperation: "Created",
              outputState: "ObjectWrite",
            })),
          },
          objectTypes: {
            [treasuryId]: `${packageId}::treasury::Treasury<0x2::sui::SUI>`,
            [capId]: `${packageId}::treasury::TreasurerCap<0x2::sui::SUI>`,
          },
        }),
        packageId,
      ),
    ).toEqual({ treasuryId, treasurerCapId: capId });
  });

  it("creates explorer links only for real digest-shaped values", () => {
    expect(testnetExplorerTransactionUrl(digest)).toContain("network=testnet");
    expect(testnetExplorerTransactionUrl("not-submitted")).toBeNull();
  });
});
