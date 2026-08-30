import { describe, expect, it } from "vitest";
import {
  compareReceiptAmount,
  evaluateClaimRules,
  findPotentialDuplicateClaims,
} from "@/src/domain/claim-rules";
import { asMinorAmount } from "@/src/domain/money";
import { claimSchema } from "@/src/domain/schemas";

describe("claim rules", () => {
  it("classifies matching, missing, lower, and higher receipt amounts", () => {
    const requested = asMinorAmount(7_500);

    expect(compareReceiptAmount(requested, asMinorAmount(7_500))).toMatchObject(
      {
        status: "match",
        matches: true,
        differenceMinor: 0,
      },
    );
    expect(compareReceiptAmount(requested, null)).toMatchObject({
      status: "missing",
      matches: false,
      differenceMinor: 0,
    });
    expect(compareReceiptAmount(requested, asMinorAmount(7_000))).toMatchObject(
      {
        status: "receipt_lower",
        differenceMinor: 500,
      },
    );
    expect(compareReceiptAmount(requested, asMinorAmount(8_000))).toMatchObject(
      {
        status: "receipt_higher",
        differenceMinor: 500,
      },
    );
  });

  it("finds exact duplicates by receipt reference", () => {
    const result = findPotentialDuplicateClaims(
      {
        id: "new",
        merchant: "Campus Print Shop",
        receiptReference: " RCP-001 ",
        requestedAmountMinor: asMinorAmount(7_500),
      },
      [
        {
          id: "existing",
          merchant: "Different Merchant",
          receiptReference: "rcp-001",
          requestedAmountMinor: asMinorAmount(1_000),
        },
      ],
    );

    expect(result.exactIds).toEqual(["existing"]);
    expect(result.hasExact).toBe(true);
  });

  it("finds exact duplicates by immutable receipt hash", () => {
    const hash = "a".repeat(64);
    const result = findPotentialDuplicateClaims(
      {
        id: "new",
        merchant: "New Merchant",
        receiptReference: "NEW",
        receiptHash: hash,
        requestedAmountMinor: asMinorAmount(7_500),
      },
      [
        {
          id: "existing",
          merchant: "Old Merchant",
          receiptReference: "OLD",
          receiptHash: hash,
          requestedAmountMinor: asMinorAmount(1_000),
        },
      ],
    );

    expect(result.exactIds).toEqual(["existing"]);
  });

  it("finds similar duplicates by normalized merchant and exact amount", () => {
    const result = findPotentialDuplicateClaims(
      {
        id: "new",
        merchant: "Campus   Print Shop",
        receiptReference: "RCP-NEW",
        requestedAmountMinor: asMinorAmount(7_500),
      },
      [
        {
          id: "existing",
          merchant: "campus print shop",
          receiptReference: "RCP-OLD",
          requestedAmountMinor: asMinorAmount(7_500),
        },
      ],
    );

    expect(result.similarIds).toEqual(["existing"]);
    expect(result.hasSimilar).toBe(true);
  });

  it("recommends approve when receipt, duplicate, and balance checks pass", () => {
    const evaluation = evaluateClaimRules({
      claim: makeClaim(7_500, 7_500),
      merchant: "Campus Bookstore",
      receiptReference: "NEW-001",
      existingClaims: [],
      categoryAllocatedMinor: asMinorAmount(20_000),
      categorySpentMinor: asMinorAmount(0),
    });

    expect(evaluation.recommendation).toBe("approve");
    expect(evaluation.hasSufficientBudget).toBe(true);
  });

  it("recommends review for missing evidence or a similar duplicate", () => {
    const evaluation = evaluateClaimRules({
      claim: makeClaim(7_500, null),
      merchant: "Campus Bookstore",
      receiptReference: "NEW-002",
      existingClaims: [
        {
          id: "existing",
          merchant: "Campus Bookstore",
          receiptReference: "OLD-002",
          requestedAmountMinor: asMinorAmount(7_500),
        },
      ],
      categoryAllocatedMinor: asMinorAmount(20_000),
      categorySpentMinor: asMinorAmount(0),
    });

    expect(evaluation.recommendation).toBe("review");
    expect(evaluation.duplicates.hasSimilar).toBe(true);
  });

  it("recommends reject for exact duplicates or insufficient category budget", () => {
    const evaluation = evaluateClaimRules({
      claim: makeClaim(7_500, 7_500),
      merchant: "Campus Bookstore",
      receiptReference: "RCP-EXACT",
      existingClaims: [
        {
          id: "existing",
          merchant: "Campus Bookstore",
          receiptReference: "rcp-exact",
          requestedAmountMinor: asMinorAmount(7_500),
        },
      ],
      categoryAllocatedMinor: asMinorAmount(8_000),
      categorySpentMinor: asMinorAmount(2_000),
    });

    expect(evaluation.recommendation).toBe("reject");
    expect(evaluation.duplicates.hasExact).toBe(true);
    expect(evaluation.hasSufficientBudget).toBe(false);
  });
});

function makeClaim(requested: number, receipt: number | null) {
  return claimSchema.parse({
    id: "new-claim",
    treasuryId: "treasury",
    categoryId: "marketing",
    submitterName: "Demo Member",
    description: "Demo expense",
    requestedAmountMinor: requested,
    receiptAmountMinor: receipt,
    currency: "USDC",
    status: "under_review",
    recommendation: null,
  });
}
