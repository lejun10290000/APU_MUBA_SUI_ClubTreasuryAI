import { describe, expect, it } from "vitest";

import type { PersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";
import {
  buildLiveTreasurySummary,
  getManagedTreasuries,
  resolveSelectedTreasury,
  type ManagedDashboardClaim,
} from "@/src/lib/dashboard/live-dashboard";

function treasury(
  id: string,
  role: PersistedTreasuryWorkspace["role"],
  spentMinor: number,
): PersistedTreasuryWorkspace {
  return {
    id,
    externalReference: `${id}-ref`,
    name: `Treasury ${id}`,
    totalBudgetMinor: 100,
    suiTreasuryObjectId: `0x${"1".repeat(64)}`,
    suiTreasurerCapObjectId: `0x${"2".repeat(64)}`,
    suiActivationStatus: "active",
    budgetLockedAt: "2026-09-05T01:00:00.000Z",
    activatedAt: "2026-09-05T02:00:00.000Z",
    activation: null,
    linkedToSui: true,
    joinCode: "LIVE-TEST",
    role,
    categories: [
      {
        id: `${id}-food`,
        externalReference: "food",
        name: "Food",
        allocatedMinor: 100,
        spentMinor,
      },
    ],
  };
}

const claims: ManagedDashboardClaim[] = [
  {
    id: "claim-a",
    treasuryId: "owner",
    treasuryName: "Treasury owner",
    categoryName: "Food",
    merchant: "Campus Cafe",
    submitterName: "Member A",
    requestedAmountMinor: 10,
    recommendation: "review",
    status: "under_review",
    paymentStatus: "unpaid",
    createdAt: "2026-09-05T03:00:00.000Z",
  },
  {
    id: "claim-b",
    treasuryId: "owner",
    treasuryName: "Treasury owner",
    categoryName: "Food",
    merchant: "Campus Shop",
    submitterName: "Member B",
    requestedAmountMinor: 20,
    recommendation: "approve",
    status: "approved_unpaid",
    paymentStatus: "unpaid",
    createdAt: "2026-09-05T02:30:00.000Z",
  },
  {
    id: "claim-other",
    treasuryId: "treasurer",
    treasuryName: "Treasury treasurer",
    categoryName: "Food",
    merchant: "Other Merchant",
    submitterName: "Member C",
    requestedAmountMinor: 5,
    recommendation: "approve",
    status: "submitted",
    paymentStatus: "unpaid",
    createdAt: "2026-09-05T02:00:00.000Z",
  },
];

describe("live Overview dashboard model", () => {
  it("shows only owner/treasurer workspaces and keeps newest API order", () => {
    const workspaces = [
      treasury("owner", "owner", 25),
      treasury("member", "member", 0),
      treasury("treasurer", "treasurer", 10),
    ];

    expect(getManagedTreasuries(workspaces).map((item) => item.id)).toEqual([
      "owner",
      "treasurer",
    ]);
  });

  it("honors a valid URL treasury and otherwise selects the newest managed treasury", () => {
    const managed = getManagedTreasuries([
      treasury("newest", "owner", 0),
      treasury("older", "treasurer", 0),
    ]);

    expect(resolveSelectedTreasury(managed, "older")?.id).toBe("older");
    expect(resolveSelectedTreasury(managed, "missing")?.id).toBe("newest");
    expect(resolveSelectedTreasury(managed, null)?.id).toBe("newest");
  });

  it("computes live spend, remaining budget and claim counts for only the selected treasury", () => {
    const selected = treasury("owner", "owner", 25);
    const summary = buildLiveTreasurySummary(selected, claims);

    expect(summary.spentMinor).toBe(25);
    expect(summary.remainingMinor).toBe(75);
    expect(summary.pendingClaims).toBe(2);
    expect(summary.underReviewClaims).toBe(1);
    expect(summary.approvedUnpaidClaims).toBe(1);
    expect(summary.budgetBalanced).toBe(true);
    expect(summary.claims.map((claim) => claim.id)).toEqual([
      "claim-a",
      "claim-b",
    ]);
  });
});
