import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  demoSuiAddress,
  persistedClaimSchema,
  type PersistedClaim,
} from "@/src/domain/stage5-claims";
import {
  isActivePaymentAttemptStatus,
  parseApprovedPayoutSnapshot,
} from "@/src/domain/stage6-payments";

describe("Stage 6 payment domain", () => {
  it("accepts only a complete approved-unpaid payout snapshot", () => {
    const claim = makeApprovedClaim();

    expect(parseApprovedPayoutSnapshot(claim)).toEqual({
      treasuryObjectId: demoSuiAddress,
      categoryReference: "marketing",
      recipientSuiAddress: demoSuiAddress,
      amountMinor: 7_500,
      currency: "USDC",
    });
  });

  it("rejects a claim that is not approved_unpaid", () => {
    const claim = makeApprovedClaim({ status: "under_review", decision: null });

    expect(() => parseApprovedPayoutSnapshot(claim)).toThrow(/not eligible/i);
  });

  it("rejects an approved_unpaid claim without an approve decision", () => {
    const claim = makeApprovedClaim({ decision: "reject" });

    expect(() => parseApprovedPayoutSnapshot(claim)).toThrow(/not eligible/i);
  });

  it("rejects an approved claim without a complete immutable snapshot", () => {
    const claim = makeApprovedClaim({ approvedSnapshot: null });

    expect(() => parseApprovedPayoutSnapshot(claim)).toThrow(/snapshot/i);
  });

  it("recognizes the exact active payment-attempt states", () => {
    expect(isActivePaymentAttemptStatus("prepared")).toBe(true);
    expect(isActivePaymentAttemptStatus("signed")).toBe(true);
    expect(isActivePaymentAttemptStatus("submitted")).toBe(true);
    expect(isActivePaymentAttemptStatus("reconciliation_required")).toBe(true);
    expect(isActivePaymentAttemptStatus("confirmed")).toBe(false);
    expect(isActivePaymentAttemptStatus("cancelled")).toBe(false);
    expect(isActivePaymentAttemptStatus("failed")).toBe(false);
  });
});

function makeApprovedClaim(
  overrides: Record<string, unknown> = {},
): PersistedClaim {
  return persistedClaimSchema.parse({
    id: randomUUID(),
    externalReference: randomUUID(),
    treasuryId: randomUUID(),
    categoryId: randomUUID(),
    categoryName: "Marketing",
    categoryExternalReference: "marketing",
    treasuryObjectId: demoSuiAddress,
    memberWalletAddress: demoSuiAddress,
    recipientSuiAddress: demoSuiAddress,
    submitterName: "Aina Rahman",
    merchant: "Campus Print Shop",
    description: "Workshop printing",
    requestedAmountMinor: 7_500,
    receiptAmountMinor: 7_500,
    receiptReference: "RCP-001",
    receiptHash: "a".repeat(64),
    receiptMimeType: "image/png",
    receiptSizeBytes: 128,
    receiptAnalysis: null,
    duplicateMatch: { exactIds: [], similarIds: [] },
    recommendation: "approve",
    recommendationReasons: ["All deterministic checks passed."],
    status: "approved_unpaid",
    decision: "approve",
    decisionReason: "Treasurer approved the claim.",
    paymentStatus: "unpaid",
    approvedSnapshot: {
      treasuryObjectId: demoSuiAddress,
      categoryReference: "marketing",
      recipientSuiAddress: demoSuiAddress,
      amountMinor: 7_500,
      currency: "USDC",
    },
    createdAt: "2026-09-01T00:00:00.000Z",
    decidedAt: "2026-09-01T00:01:00.000Z",
    ...overrides,
  });
}
