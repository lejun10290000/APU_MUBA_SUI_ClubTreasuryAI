import { describe, expect, it } from "vitest";
import {
  calculateCategoryRemaining,
  checkBudgetTotal,
  hasSufficientCategoryRemaining,
} from "@/src/domain/budget-rules";
import { asMinorAmount } from "@/src/domain/money";

describe("deterministic budget rules", () => {
  it("recognizes a balanced budget", () => {
    const result = checkBudgetTotal(asMinorAmount(100_000), [
      asMinorAmount(30_000),
      asMinorAmount(20_000),
      asMinorAmount(25_000),
      asMinorAmount(15_000),
      asMinorAmount(10_000),
    ]);

    expect(result).toEqual({
      isBalanced: true,
      status: "balanced",
      totalMinor: 100_000,
      allocatedMinor: 100_000,
      differenceMinor: 0,
    });
  });

  it.each([
    {
      categories: [30_000, 20_000],
      status: "under_allocated",
      difference: 50_000,
    },
    {
      categories: [70_000, 40_000],
      status: "over_allocated",
      difference: 10_000,
    },
  ] as const)(
    "reports a $status budget",
    ({ categories, status, difference }) => {
      const result = checkBudgetTotal(
        asMinorAmount(100_000),
        categories.map((amount) => asMinorAmount(amount)),
      );

      expect(result.isBalanced).toBe(false);
      expect(result.status).toBe(status);
      expect(result.differenceMinor).toBe(difference);
    },
  );

  it("calculates remaining category funds using minor units", () => {
    expect(
      calculateCategoryRemaining(asMinorAmount(20_000), asMinorAmount(7_500)),
    ).toBe(12_500);
  });

  it("checks whether a category can cover a request", () => {
    expect(
      hasSufficientCategoryRemaining(
        asMinorAmount(20_000),
        asMinorAmount(7_500),
        asMinorAmount(12_500),
      ),
    ).toBe(true);
    expect(
      hasSufficientCategoryRemaining(
        asMinorAmount(20_000),
        asMinorAmount(7_500),
        asMinorAmount(12_501),
      ),
    ).toBe(false);
  });

  it("rejects an impossible negative remaining balance", () => {
    expect(() =>
      calculateCategoryRemaining(asMinorAmount(5_000), asMinorAmount(5_001)),
    ).toThrow("Spent amount cannot exceed the category allocation.");
  });
});
