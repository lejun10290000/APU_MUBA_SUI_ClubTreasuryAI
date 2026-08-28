import { describe, expect, it } from "vitest";
import {
  budgetSetupInputSchema,
  buildDemoBudget,
  buildDemoClaimRecord,
  buildDemoDecision,
  claimSubmissionInputSchema,
} from "@/src/domain/demo-workflow";
import { demoBudget, demoTreasury } from "@/src/data/mock-dashboard";

describe("Stage 2 demo workflow builders", () => {
  it("builds a balanced schema-valid budget in minor units", () => {
    const budget = buildDemoBudget(demoTreasury, {
      categories: [
        { name: "Venue", allocation: "500.00" },
        { name: "Catering", allocation: "300.00" },
        { name: "Marketing", allocation: "200.00" },
      ],
    });

    expect(budget.status).toBe("confirmed");
    expect(
      budget.categories.map((category) => category.allocatedMinor),
    ).toEqual([50_000, 30_000, 20_000]);
  });

  it.each([
    ["under", "199.99", "Allocate the full treasury total"],
    ["over", "200.01", "cannot exceed the treasury total"],
  ])("rejects an %s-allocated budget", (_status, marketing, message) => {
    expect(() =>
      buildDemoBudget(demoTreasury, {
        categories: [
          { name: "Venue", allocation: "500.00" },
          { name: "Catering", allocation: "300.00" },
          { name: "Marketing", allocation: marketing },
        ],
      }),
    ).toThrow(message);
  });

  it("rejects duplicate category names and invalid allocations", () => {
    const result = budgetSetupInputSchema.safeParse({
      categories: [
        { name: "Food", allocation: "100.00" },
        { name: " food ", allocation: "1.234" },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          "Category names must be unique.",
          "Enter a valid USDC amount with up to 2 decimal places.",
        ]),
      );
    }
  });

  it("builds a claim record with optional typed receipt evidence", () => {
    const record = buildDemoClaimRecord(demoTreasury, demoBudget, {
      submitterName: "Aina Rahman",
      description: "Workshop stationery",
      merchant: "Campus Bookstore",
      categoryId: "marketing",
      requestedAmount: "75.00",
      receiptAmount: "74.50",
      receiptReference: "BOOK-104",
    });

    expect(record.claim.requestedAmountMinor).toBe(7_500);
    expect(record.claim.receiptAmountMinor).toBe(7_450);
    expect(record.receiptReference).toBe("BOOK-104");
  });

  it("rejects invalid claim display amounts and unknown categories", () => {
    expect(
      claimSubmissionInputSchema.safeParse({
        submitterName: "Aina Rahman",
        description: "Workshop stationery",
        merchant: "Campus Bookstore",
        categoryId: "marketing",
        requestedAmount: "7.555",
        receiptAmount: "",
        receiptReference: "",
      }).success,
    ).toBe(false);

    expect(() =>
      buildDemoClaimRecord(demoTreasury, demoBudget, {
        submitterName: "Aina Rahman",
        description: "Workshop stationery",
        merchant: "Campus Bookstore",
        categoryId: "unknown",
        requestedAmount: "75.00",
        receiptAmount: "",
        receiptReference: "",
      }),
    ).toThrow("Choose a category from the active demo budget.");
  });

  it("keeps a human approval in the approved-unpaid state", () => {
    expect(buildDemoDecision("claim-1", "approve", "review")).toEqual({
      claimId: "claim-1",
      decision: "approve",
      resultingStatus: "approved_unpaid",
      ruleRecommendation: "review",
      decidedLabel: "Just now",
    });
  });
});
