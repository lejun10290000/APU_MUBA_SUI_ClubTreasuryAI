import { describe, expect, it } from "vitest";

import {
  ActivationReconciliationRequiredError,
  verifyAllocationActivation,
  verifyCreateActivation,
  verifyFundActivation,
} from "@/src/lib/sui/activation-verification";

const id = (digit: string) => `0x${digit.repeat(64)}`;
const packageId = id("1");
const treasuryId = id("2");
const capId = id("3");
const owner = id("4");
const coinType = `${id("a")}::usdc::USDC`;

describe("A2 activation chain verification", () => {
  it("extracts the exact created Treasury and TreasurerCap", () => {
    expect(
      verifyCreateActivation(
        {
          digest: "digest",
          success: true,
          checkpointed: true,
          sender: owner,
          moveCalls: [{ packageId, module: "treasury", function: "create", typeArguments: [coinType] }],
          createdObjects: [
            { objectId: treasuryId, type: `${packageId}::treasury::Treasury<${coinType}>` },
            { objectId: capId, type: `${packageId}::treasury::TreasurerCap<${coinType}>` },
          ],
        },
        { digest: "digest", ownerWalletAddress: owner, packageId, coinType },
      ),
    ).toEqual({ treasuryObjectId: treasuryId, treasurerCapObjectId: capId });
  });

  it("verifies exact funding and frozen allocations", () => {
    const transaction = {
      digest: "digest",
      success: true,
      checkpointed: true,
      sender: owner,
      moveCalls: [{ packageId, module: "treasury", function: "deposit", typeArguments: [coinType], objectIds: [treasuryId] }],
      createdObjects: [],
    };
    expect(() =>
      verifyFundActivation(transaction, {
        digest: "digest",
        ownerWalletAddress: owner,
        packageId,
        coinType,
        expectedBudgetAtomic: 10_000_000n,
        treasuryObjectId: treasuryId,
        treasury: { objectId: treasuryId, treasurerAddress: owner, externalReference: "workspace", custodyAtomic: 10_000_000n, allocationsConfirmed: false, categories: [] },
      }),
    ).not.toThrow();

    expect(() =>
      verifyAllocationActivation(
        { ...transaction, moveCalls: [{ ...transaction.moveCalls[0]!, function: "confirm_allocations", objectIds: [treasuryId, capId] }] },
        {
          digest: "digest",
          ownerWalletAddress: owner,
          packageId,
          coinType,
          treasury: {
            objectId: treasuryId,
            treasurerAddress: owner,
            externalReference: "workspace",
            custodyAtomic: 10_000_000n,
            allocationsConfirmed: true,
            categories: [
              { reference: "food", allocatedAtomic: 4_000_000n, remainingAtomic: 4_000_000n },
              { reference: "venue", allocatedAtomic: 6_000_000n, remainingAtomic: 6_000_000n },
            ],
          },
          treasuryObjectId: treasuryId,
          treasurerCapObjectId: capId,
          expectedCategories: [
            { reference: "food", allocatedAtomic: 4_000_000n },
            { reference: "venue", allocatedAtomic: 6_000_000n },
          ],
        },
      ),
    ).not.toThrow();
  });

  it("accepts the same frozen allocations when chain category order differs", () => {
    const transaction = {
      digest: "digest",
      success: true,
      checkpointed: true,
      sender: owner,
      moveCalls: [
        {
          packageId,
          module: "treasury",
          function: "confirm_allocations",
          typeArguments: [coinType],
          objectIds: [treasuryId, capId],
        },
      ],
      createdObjects: [],
    };

    expect(() =>
      verifyAllocationActivation(transaction, {
        digest: "digest",
        ownerWalletAddress: owner,
        packageId,
        coinType,
        treasuryObjectId: treasuryId,
        treasurerCapObjectId: capId,
        treasury: {
          objectId: treasuryId,
          treasurerAddress: owner,
          externalReference: "workspace",
          custodyAtomic: 10_000_000n,
          allocationsConfirmed: true,
          categories: [
            { reference: "marketing", allocatedAtomic: 5_000_000n, remainingAtomic: 5_000_000n },
            { reference: "venue", allocatedAtomic: 3_000_000n, remainingAtomic: 3_000_000n },
            { reference: "food", allocatedAtomic: 2_000_000n, remainingAtomic: 2_000_000n },
          ],
        },
        expectedCategories: [
          { reference: "marketing", allocatedAtomic: 5_000_000n },
          { reference: "food", allocatedAtomic: 2_000_000n },
          { reference: "venue", allocatedAtomic: 3_000_000n },
        ],
      }),
    ).not.toThrow();
  });

  it("requires reconciliation for success-shaped mismatched evidence", () => {
    expect(() =>
      verifyFundActivation(
        {
          digest: "digest",
          success: true,
          checkpointed: true,
          sender: owner,
          moveCalls: [{ packageId, module: "treasury", function: "deposit", typeArguments: [coinType], objectIds: [treasuryId] }],
          createdObjects: [],
        },
        {
          digest: "digest",
          ownerWalletAddress: owner,
          packageId,
          coinType,
          expectedBudgetAtomic: 10_000_000n,
          treasuryObjectId: treasuryId,
          treasury: { objectId: treasuryId, treasurerAddress: owner, externalReference: "workspace", custodyAtomic: 9_000_000n, allocationsConfirmed: false, categories: [] },
        },
      ),
    ).toThrow(ActivationReconciliationRequiredError);
  });
});
