import { randomUUID } from "node:crypto";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { persistedClaimSchema } from "@/src/domain/stage5-claims";

const claimId = "69a20a42-ae58-4547-b2f5-28bb2de52262";
const state = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`claim=${claimId}`),
}));
vi.mock("@/src/components/claim-payout-panel", () => ({
  ClaimPayoutPanel: () => null,
}));

beforeEach(() => {
  state.fetch.mockReset();
  vi.stubGlobal("fetch", state.fetch);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows Gemini provenance and the AI-to-Sui decision pipeline", async () => {
  const claim = persistedClaimSchema.parse({
    id: claimId,
    externalReference: "STAGE8-AI-001",
    treasuryId: randomUUID(),
    categoryId: randomUUID(),
    categoryName: "Food",
    categoryExternalReference: "food",
    treasuryObjectId: `0x${"a".repeat(64)}`,
    memberWalletAddress: `0x${"1".repeat(64)}`,
    recipientSuiAddress: `0x${"1".repeat(64)}`,
    submitterName: "Demo Member",
    merchant: "Campus Cafe",
    description: "Workshop refreshments",
    requestedAmountMinor: 10,
    receiptAmountMinor: 10,
    receiptReference: "CAFE-1001",
    receiptHash: "d".repeat(64),
    receiptMimeType: "image/png",
    receiptSizeBytes: 128,
    receiptAnalysis: {
      merchant: "Campus Cafe",
      amountMinor: 10,
      currency: "USDC",
      receiptDate: "2026-09-05",
      description: "Sandwich and tea",
      categorySuggestion: "Food",
      needsReview: false,
      missingFields: [],
      reasons: ["Receipt is legible."],
    },
    duplicateMatch: { exactIds: [], similarIds: [] },
    recommendation: "approve",
    recommendationReasons: ["Evidence checks passed."],
    status: "under_review",
    decision: null,
    decisionReason: null,
    paymentStatus: "unpaid",
    approvedSnapshot: null,
    createdAt: "2026-09-05T07:00:00.000Z",
    decidedAt: null,
    confirmedTransactionDigest: null,
    paidAt: null,
  });
  state.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      claim,
      treasuryLink: { linked: true, treasuryObjectId: claim.treasuryObjectId },
      receiptPreviewUrl: null,
      aiProvenance: {
        provider: "Google Gemini",
        model: "gemini-2.5-flash",
        mode: "live",
        task: "receipt_analysis",
        generatedAt: claim.createdAt,
        humanConfirmationRequired: true,
      },
    }),
  } as Response);

  const { ClaimReviewPanel } = await import("@/src/components/claim-review-panel");
  render(<ClaimReviewPanel />);

  expect(
    await screen.findByRole("heading", { name: "Campus Cafe" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Google Gemini")).toBeInTheDocument();
  expect(screen.getByText("gemini-2.5-flash")).toBeInTheDocument();
  expect(screen.getByText("Gemini AI")).toBeInTheDocument();
  expect(screen.getByText("Deterministic Rule")).toBeInTheDocument();
  expect(screen.getByText("Human Decision")).toBeInTheDocument();
  expect(screen.getByText("Sui On-chain")).toBeInTheDocument();
  expect(screen.getByText(/Gemini extracts evidence/i)).toBeInTheDocument();
});
