import { addMinorAmounts, asMinorAmount, type MinorAmount } from "./money";

export type BudgetTotalStatus =
  | "balanced"
  | "under_allocated"
  | "over_allocated";

export interface BudgetTotalCheck {
  isBalanced: boolean;
  status: BudgetTotalStatus;
  totalMinor: MinorAmount;
  allocatedMinor: MinorAmount;
  differenceMinor: MinorAmount;
}

export function checkBudgetTotal(
  totalMinor: MinorAmount,
  categoryAmounts: readonly MinorAmount[],
): BudgetTotalCheck {
  const allocatedMinor = addMinorAmounts(...categoryAmounts);
  const differenceMinor = asMinorAmount(Math.abs(totalMinor - allocatedMinor));

  if (allocatedMinor === totalMinor) {
    return {
      isBalanced: true,
      status: "balanced",
      totalMinor,
      allocatedMinor,
      differenceMinor,
    };
  }

  return {
    isBalanced: false,
    status: allocatedMinor < totalMinor ? "under_allocated" : "over_allocated",
    totalMinor,
    allocatedMinor,
    differenceMinor,
  };
}

export function calculateCategoryRemaining(
  allocatedMinor: MinorAmount,
  spentMinor: MinorAmount,
): MinorAmount {
  if (spentMinor > allocatedMinor) {
    throw new Error("Spent amount cannot exceed the category allocation.");
  }

  return asMinorAmount(allocatedMinor - spentMinor);
}

export function hasSufficientCategoryRemaining(
  allocatedMinor: MinorAmount,
  spentMinor: MinorAmount,
  requestedMinor: MinorAmount,
): boolean {
  return (
    requestedMinor <= calculateCategoryRemaining(allocatedMinor, spentMinor)
  );
}
