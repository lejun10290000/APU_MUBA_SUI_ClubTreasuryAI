import { bcs } from "@mysten/sui/bcs";
import type { Transaction } from "@mysten/sui/transactions";
import { fromBase64, fromHex } from "@mysten/sui/utils";
import { describe, expect, it } from "vitest";
import type { SuiDeploymentConfig } from "@/src/lib/sui/deployment";
import { SuiIntegrationError } from "@/src/lib/sui/errors";
import {
  buildConfirmAllocationsTransaction,
  buildCreateTreasuryTransaction,
  buildFundTreasuryTransaction,
  buildPayoutTransaction,
} from "@/src/lib/sui/transactions";

const id = (digit: string) => `0x${digit.repeat(64)}`;
const PACKAGE_ID = id("1");
const TREASURY_ID = id("2");
const CAP_ID = id("3");
const COIN_ID = id("4");
const RECIPIENT = id("5");
const USDC_TYPE = `${id("a")}::usdc::USDC`;

const deployment: SuiDeploymentConfig = {
  network: "testnet",
  packageId: PACKAGE_ID,
  usdcCoinType: USDC_TYPE,
};

type Snapshot = {
  inputs: Array<{
    Pure?: { bytes: string };
    UnresolvedObject?: { objectId: string };
  }>;
  commands: unknown[];
};

function snapshot(transaction: Transaction) {
  return transaction.getData() as Snapshot;
}

function pureBytes(transaction: Transaction, index: number) {
  const bytes = snapshot(transaction).inputs[index]?.Pure?.bytes;
  expect(bytes).toBeDefined();
  return fromBase64(bytes!);
}

function expectIntegrationError(
  callback: () => unknown,
  code: SuiIntegrationError["code"],
) {
  try {
    callback();
    throw new Error("Expected a SuiIntegrationError");
  } catch (error) {
    expect(error).toBeInstanceOf(SuiIntegrationError);
    expect((error as SuiIntegrationError).code).toBe(code);
  }
}

describe("Sui treasury transaction builders", () => {
  it("builds treasury creation with the exact target, type, and UTF-8 reference", () => {
    const transaction = buildCreateTreasuryTransaction(deployment, {
      externalReference: "club-α",
    });
    const data = snapshot(transaction);

    expect(data.commands[0]).toMatchObject({
      MoveCall: {
        package: PACKAGE_ID,
        module: "treasury",
        function: "create",
        typeArguments: [USDC_TYPE],
      },
    });
    expect(bcs.vector(bcs.u8()).parse(pureBytes(transaction, 0))).toEqual([
      ...new TextEncoder().encode("club-α"),
    ]);
    expectIntegrationError(
      () =>
        buildCreateTreasuryTransaction(deployment, { externalReference: "" }),
      "EMPTY_REFERENCE",
    );
  });

  it("builds an exact coin split followed by the deposit Move call", () => {
    const transaction = buildFundTreasuryTransaction(deployment, {
      treasuryId: TREASURY_ID,
      sourceCoinId: COIN_ID,
      amount: 2_500_001n,
    });
    const data = snapshot(transaction);

    expect(data.commands[0]).toMatchObject({ SplitCoins: {} });
    expect(data.commands[1]).toMatchObject({
      MoveCall: {
        package: PACKAGE_ID,
        module: "treasury",
        function: "deposit",
        typeArguments: [USDC_TYPE],
      },
    });
    expect(JSON.stringify(data)).toContain(TREASURY_ID);
    expect(JSON.stringify(data)).toContain(COIN_ID);
    expect(bcs.u64().parse(pureBytes(transaction, 1))).toBe("2500001");
    expectIntegrationError(
      () =>
        buildFundTreasuryTransaction(deployment, {
          treasuryId: TREASURY_ID,
          sourceCoinId: COIN_ID,
          amount: 0n,
        }),
      "INVALID_AMOUNT",
    );
    expectIntegrationError(
      () =>
        buildFundTreasuryTransaction(deployment, {
          treasuryId: "not-an-id",
          sourceCoinId: COIN_ID,
          amount: 1n,
        }),
      "INVALID_OBJECT_ID",
    );
  });

  it("builds ordered allocation references and exact u64 values", () => {
    const transaction = buildConfirmAllocationsTransaction(deployment, {
      treasuryId: TREASURY_ID,
      treasurerCapId: CAP_ID,
      categoryReferences: ["events", "travel"],
      allocations: [1_000_000n, 2_000_000n],
    });
    const data = snapshot(transaction);

    expect(data.commands[0]).toMatchObject({
      MoveCall: {
        package: PACKAGE_ID,
        module: "treasury",
        function: "confirm_allocations",
        typeArguments: [USDC_TYPE],
      },
    });
    expect(JSON.stringify(data)).toContain(TREASURY_ID);
    expect(JSON.stringify(data)).toContain(CAP_ID);
    expect(
      bcs.vector(bcs.vector(bcs.u8())).parse(pureBytes(transaction, 2)),
    ).toEqual([
      [...new TextEncoder().encode("events")],
      [...new TextEncoder().encode("travel")],
    ]);
    expect(bcs.vector(bcs.u64()).parse(pureBytes(transaction, 3))).toEqual([
      "1000000",
      "2000000",
    ]);
  });

  it("rejects invalid allocation vectors before building", () => {
    const base = {
      treasuryId: TREASURY_ID,
      treasurerCapId: CAP_ID,
    };
    expectIntegrationError(
      () =>
        buildConfirmAllocationsTransaction(deployment, {
          ...base,
          categoryReferences: [],
          allocations: [],
        }),
      "EMPTY_REFERENCE",
    );
    expectIntegrationError(
      () =>
        buildConfirmAllocationsTransaction(deployment, {
          ...base,
          categoryReferences: ["events"],
          allocations: [1n, 2n],
        }),
      "INVALID_AMOUNT",
    );
    expectIntegrationError(
      () =>
        buildConfirmAllocationsTransaction(deployment, {
          ...base,
          categoryReferences: ["events", "events"],
          allocations: [1n, 2n],
        }),
      "DUPLICATE_CATEGORY_REFERENCE",
    );
    expectIntegrationError(
      () =>
        buildConfirmAllocationsTransaction(deployment, {
          ...base,
          categoryReferences: ["events"],
          allocations: [0n],
        }),
      "INVALID_AMOUNT",
    );
  });

  it("builds payout with recipient, category bytes, and exact u64 amount", () => {
    const transaction = buildPayoutTransaction(deployment, {
      treasuryId: TREASURY_ID,
      treasurerCapId: CAP_ID,
      categoryReference: "events",
      recipient: RECIPIENT,
      amount: 700_005n,
    });
    const data = snapshot(transaction);

    expect(data.commands[0]).toMatchObject({
      MoveCall: {
        package: PACKAGE_ID,
        module: "treasury",
        function: "payout",
        typeArguments: [USDC_TYPE],
      },
    });
    expect(JSON.stringify(data)).toContain(TREASURY_ID);
    expect(JSON.stringify(data)).toContain(CAP_ID);
    expect(bcs.vector(bcs.u8()).parse(pureBytes(transaction, 2))).toEqual([
      ...new TextEncoder().encode("events"),
    ]);
    expect(pureBytes(transaction, 3)).toEqual(fromHex(RECIPIENT));
    expect(bcs.u64().parse(pureBytes(transaction, 4))).toBe("700005");
  });

  it("rejects invalid payout values", () => {
    const payout = {
      treasuryId: TREASURY_ID,
      treasurerCapId: CAP_ID,
      categoryReference: "events",
      recipient: RECIPIENT,
      amount: 1n,
    };
    expectIntegrationError(
      () =>
        buildPayoutTransaction(deployment, { ...payout, recipient: id("0") }),
      "INVALID_RECIPIENT",
    );
    expectIntegrationError(
      () => buildPayoutTransaction(deployment, { ...payout, recipient: "0x5" }),
      "INVALID_RECIPIENT",
    );
    expectIntegrationError(
      () => buildPayoutTransaction(deployment, { ...payout, amount: 0n }),
      "INVALID_AMOUNT",
    );
    expectIntegrationError(
      () =>
        buildPayoutTransaction(deployment, {
          ...payout,
          categoryReference: "",
        }),
      "EMPTY_REFERENCE",
    );
  });

  it("never substitutes a package ID when deployment is not ready", () => {
    expectIntegrationError(
      () =>
        buildCreateTreasuryTransaction(
          { ...deployment, packageId: null },
          { externalReference: "club" },
        ),
      "DEPLOYMENT_NOT_READY",
    );
    expectIntegrationError(
      () =>
        buildCreateTreasuryTransaction(
          { ...deployment, packageId: "TBD" },
          { externalReference: "club" },
        ),
      "INVALID_PACKAGE_ID",
    );
  });
});
