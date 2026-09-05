import { bcs } from "@mysten/sui/bcs";
import type { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import { describe, expect, it } from "vitest";

import type { SuiDeploymentConfig } from "@/src/lib/sui/deployment";
import {
  buildActivationAllocationTransaction,
  buildActivationCreateTransaction,
  buildActivationFundTransaction,
} from "@/src/lib/sui/activation-transactions";

const id = (digit: string) => `0x${digit.repeat(64)}`;
const deployment: SuiDeploymentConfig = {
  network: "testnet",
  packageId: id("1"),
  usdcCoinType: `${id("a")}::usdc::USDC`,
};

function commands(transaction: Transaction) {
  return transaction.getData().commands;
}

describe("A2 activation transaction builders", () => {
  it("builds Create for the verified package and workspace reference", () => {
    const tx = buildActivationCreateTransaction(deployment, {
      externalReference: "workspace-123",
    });
    expect(commands(tx)[0]).toMatchObject({
      MoveCall: { package: deployment.packageId, function: "create" },
    });
  });

  it("merges selected USDC coins and deposits the exact amount", () => {
    const tx = buildActivationFundTransaction(deployment, {
      treasuryId: id("2"),
      sourceCoinIds: [id("3"), id("4")],
      amountAtomic: 10_000_000n,
    });
    expect(commands(tx)).toHaveLength(3);
    expect(commands(tx)[0]).toMatchObject({ MergeCoins: {} });
    expect(commands(tx)[1]).toMatchObject({ SplitCoins: {} });
    expect(commands(tx)[2]).toMatchObject({
      MoveCall: { function: "deposit" },
    });
    const amountInput = tx.getData().inputs[2];
    expect(amountInput).toHaveProperty("Pure.bytes");
    if (!amountInput || !("Pure" in amountInput) || !amountInput.Pure) {
      throw new Error("Expected pure u64 input");
    }
    expect(bcs.u64().parse(fromBase64(amountInput.Pure.bytes))).toBe(
      "10000000",
    );
  });

  it("confirms frozen dynamic allocations without a hardcoded category", () => {
    const tx = buildActivationAllocationTransaction(deployment, {
      treasuryId: id("2"),
      treasurerCapId: id("3"),
      categoryReferences: ["food", "event-marketing"],
      allocations: [4_000_000n, 6_000_000n],
    });
    expect(commands(tx)[0]).toMatchObject({
      MoveCall: { function: "confirm_allocations" },
    });
    expect(JSON.stringify(tx.getData())).not.toContain("events");
  });
});
