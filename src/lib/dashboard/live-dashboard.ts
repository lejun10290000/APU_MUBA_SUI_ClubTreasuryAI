import { checkBudgetTotal } from "@/src/domain/budget-rules";
import {
  addMinorAmounts,
  asMinorAmount,
  type MinorAmount,
} from "@/src/domain/money";
import type { PersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";

export type ManagedDashboardClaim = {
  id: string;
  treasuryId: string;
  treasuryName: string;
  categoryName: string;
  merchant: string;
  submitterName: string;
  requestedAmountMinor: number;
  recommendation: "approve" | "review" | "reject" | null;
  status: "submitted" | "under_review" | "approved_unpaid";
  paymentStatus: string;
  createdAt: string;
};

export type LiveTreasurySummary = {
  spentMinor: MinorAmount;
  remainingMinor: MinorAmount;
  pendingClaims: number;
  underReviewClaims: number;
  approvedUnpaidClaims: number;
  budgetBalanced: boolean;
  claims: ManagedDashboardClaim[];
};

export function getManagedTreasuries(
  treasuries: readonly PersistedTreasuryWorkspace[],
): PersistedTreasuryWorkspace[] {
  return treasuries
    .filter(
      (treasury) => treasury.role === "owner" || treasury.role === "treasurer",
    )
    .slice()
    .reverse();
}

export function resolveSelectedTreasury(
  treasuries: readonly PersistedTreasuryWorkspace[],
  requestedTreasuryId: string | null,
): PersistedTreasuryWorkspace | null {
  if (requestedTreasuryId) {
    const requested = treasuries.find(
      (treasury) => treasury.id === requestedTreasuryId,
    );
    if (requested) return requested;
  }
  return treasuries[0] ?? null;
}

export function buildLiveTreasurySummary(
  treasury: PersistedTreasuryWorkspace,
  claims: readonly ManagedDashboardClaim[],
): LiveTreasurySummary {
  const spentMinor = addMinorAmounts(
    ...treasury.categories.map((category) => asMinorAmount(category.spentMinor)),
  );
  const remainingMinor = asMinorAmount(
    Math.max(0, treasury.totalBudgetMinor - spentMinor),
  );
  const selectedClaims = claims.filter(
    (claim) => claim.treasuryId === treasury.id,
  );
  const budgetCheck = checkBudgetTotal(
    asMinorAmount(treasury.totalBudgetMinor),
    treasury.categories.map((category) =>
      asMinorAmount(category.allocatedMinor),
    ),
  );

  return {
    spentMinor,
    remainingMinor,
    pendingClaims: selectedClaims.length,
    underReviewClaims: selectedClaims.filter(
      (claim) => claim.status === "submitted" || claim.status === "under_review",
    ).length,
    approvedUnpaidClaims: selectedClaims.filter(
      (claim) => claim.status === "approved_unpaid",
    ).length,
    budgetBalanced: budgetCheck.isBalanced,
    claims: selectedClaims,
  };
}
