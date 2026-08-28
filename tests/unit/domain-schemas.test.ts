import { describe, expect, it } from "vitest";
import {
  budgetSchema,
  claimSchema,
  positiveMinorAmountSchema,
  treasurySchema,
} from "@/src/domain/schemas";

describe("shared domain schemas", () => {
  it("accepts schema-valid treasury, budget, and claim data", () => {
    const treasury = treasurySchema.parse({
      id: "treasury-workshop",
      name: "Web3 Workshop 2026",
      currency: "USDC",
      totalBudgetMinor: 100_000,
      status: "active",
    });

    const budget = budgetSchema.parse({
      id: "budget-workshop",
      treasuryId: treasury.id,
      currency: "USDC",
      totalMinor: treasury.totalBudgetMinor,
      status: "draft",
      categories: [
        { id: "food", name: "Food", allocatedMinor: 30_000, spentMinor: 0 },
        {
          id: "marketing",
          name: "Marketing",
          allocatedMinor: 20_000,
          spentMinor: 7_500,
        },
      ],
    });

    const claim = claimSchema.parse({
      id: "claim-banner-printing",
      treasuryId: treasury.id,
      categoryId: budget.categories[1].id,
      submitterName: "Demo Member",
      description: "Printing event banners",
      requestedAmountMinor: 7_500,
      receiptAmountMinor: 7_500,
      currency: "USDC",
      status: "under_review",
      recommendation: "approve",
    });

    expect(treasury.totalBudgetMinor).toBe(100_000);
    expect(budget.categories[1].spentMinor).toBe(7_500);
    expect(claim.requestedAmountMinor).toBe(7_500);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid positive minor-unit amount %s",
    (amount) => {
      expect(positiveMinorAmountSchema.safeParse(amount).success).toBe(false);
    },
  );

  it("rejects unsupported currencies", () => {
    const result = treasurySchema.safeParse({
      id: "treasury-workshop",
      name: "Web3 Workshop 2026",
      currency: "MYR",
      totalBudgetMinor: 100_000,
      status: "active",
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate category identifiers and names", () => {
    const result = budgetSchema.safeParse({
      id: "budget-workshop",
      treasuryId: "treasury-workshop",
      currency: "USDC",
      totalMinor: 100_000,
      status: "draft",
      categories: [
        { id: "food", name: "Food", allocatedMinor: 30_000, spentMinor: 0 },
        { id: "food", name: "food", allocatedMinor: 20_000, spentMinor: 0 },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          "Budget category IDs must be unique.",
          "Budget category names must be unique.",
        ]),
      );
    }
  });

  it("rejects a category whose spent amount exceeds its allocation", () => {
    const result = budgetSchema.safeParse({
      id: "budget-workshop",
      treasuryId: "treasury-workshop",
      currency: "USDC",
      totalMinor: 10_000,
      status: "draft",
      categories: [
        { id: "food", name: "Food", allocatedMinor: 5_000, spentMinor: 5_001 },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Spent amount cannot exceed the category allocation.",
      );
    }
  });
});
