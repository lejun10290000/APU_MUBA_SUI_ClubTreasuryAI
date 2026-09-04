import { randomUUID } from "node:crypto";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { persistedClaimSchema } from "@/src/domain/stage5-claims";

const state = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`claim=${claimId}`),
}));

vi.mock("@/src/components/claim-payout-panel", () => ({
  ClaimPayoutPanel: () => null,
}));

const claimId = "69a20a42-ae58-4547-b2f5-28bb2de52262";

beforeEach(() => {
  state.fetch.mockReset();
  vi.stubGlobal("fetch", state.fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("claim review recovery", () => {
  it("shows the persisted claim and a non-blocking warning when its private preview is unavailable", async () => {
    const claim = reviewClaim();
    state.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        claim,
        treasuryLink: {
          linked: true,
          treasuryObjectId: claim.treasuryObjectId,
        },
        receiptPreviewUrl: null,
        receiptPreviewError:
          "Private receipt preview is temporarily unavailable. The persisted claim can still be reviewed.",
      }),
    } as Response);
    const { ClaimReviewPanel } = await import(
      "@/src/components/claim-review-panel"
    );

    render(<ClaimReviewPanel />);

    expect(
      await screen.findByText("Stage 7D Recovery Merchant"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/private receipt preview is temporarily unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Human decision note")).toBeEnabled();
  });
});

function reviewClaim() {
  return persistedClaimSchema.parse({
    id: claimId,
    externalReference: "STAGE7D-RECOVERY-001",
    treasuryId: randomUUID(),
    categoryId: randomUUID(),
    categoryName: "Events",
    categoryExternalReference: "events",
    treasuryObjectId:
      "0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3",
    memberWalletAddress:
      "0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea",
    recipientSuiAddress:
      "0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea",
    submitterName: "Demo Member",
    merchant: "Stage 7D Recovery Merchant",
    description: "Synthetic recovery-path claim",
    requestedAmountMinor: 10,
    receiptAmountMinor: 10,
    receiptReference: "STAGE7D-RECOVERY-RECEIPT",
    receiptHash: "d".repeat(64),
    receiptMimeType: "image/png",
    receiptSizeBytes: 128,
    receiptAnalysis: null,
    duplicateMatch: { exactIds: [], similarIds: [] },
    recommendation: "review",
    recommendationReasons: ["Human review remains required."],
    status: "under_review",
    decision: null,
    decisionReason: null,
    paymentStatus: "unpaid",
    approvedSnapshot: null,
    createdAt: "2026-09-04T00:00:00.000Z",
    decidedAt: null,
    confirmedTransactionDigest: null,
    paidAt: null,
  });
}
