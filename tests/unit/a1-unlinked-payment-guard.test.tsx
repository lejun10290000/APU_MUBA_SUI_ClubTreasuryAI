import { randomUUID } from "node:crypto";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClaimReviewPanel } from "@/src/components/claim-review-panel";
import {
  demoSuiAddress,
  persistedClaimSchema,
  type PersistedClaimSubmission,
} from "@/src/domain/stage5-claims";
import { asMinorAmount } from "@/src/domain/money";
import { MockClaimRepository } from "@/src/lib/claims/mock-repository";
import type { PersistedWorkspace } from "@/src/lib/claims/types";

const state = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () =>
    new URLSearchParams("claim=11111111-1111-4111-8111-111111111111"),
}));
vi.mock("@/src/components/claim-payout-panel", () => ({
  ClaimPayoutPanel: () => null,
}));

beforeEach(() => {
  state.fetch.mockReset();
  state.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      claim: unlinkedClaim(),
      treasuryLink: { linked: false, treasuryObjectId: null },
    }),
  } as Response);
  vi.stubGlobal("fetch", state.fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("A1 unlinked approval and payment guards", () => {
  it("keeps rejection available but disables approval before Sui linking", async () => {
    render(<ClaimReviewPanel />);

    expect(
      await screen.findByText(
        /link this treasury to Sui before approval/i,
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/human decision note/i), {
      target: { value: "Receipt checked." },
    });
    expect(screen.getByRole("button", { name: /reject claim/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
  });

  it("enables approval for the same historical claim after its treasury is linked", async () => {
    const linkedTreasuryObjectId =
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const approvedClaim = persistedClaimSchema.parse({
      ...unlinkedClaim(),
      treasuryObjectId: linkedTreasuryObjectId,
      status: "approved_unpaid",
      decision: "approve",
      decisionReason: "Receipt checked.",
      decidedAt: "2026-09-04T01:00:00.000Z",
      approvedSnapshot: {
        treasuryObjectId: linkedTreasuryObjectId,
        categoryReference: "food",
        recipientSuiAddress: demoSuiAddress,
        amountMinor: 100,
        currency: "USDC",
      },
    });
    state.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          claim: unlinkedClaim(),
          treasuryLink: {
            linked: true,
            treasuryObjectId: linkedTreasuryObjectId,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ claim: approvedClaim }),
      } as Response);

    render(<ClaimReviewPanel />);
    fireEvent.change(await screen.findByLabelText(/human decision note/i), {
      target: { value: "Receipt checked." },
    });
    const approve = screen.getByRole("button", { name: /approve/i });
    expect(approve).toBeEnabled();
    fireEvent.click(approve);

    await waitFor(() => expect(state.fetch).toHaveBeenCalledTimes(2));
    expect(state.fetch).toHaveBeenLastCalledWith(
      "/api/claims/11111111-1111-4111-8111-111111111111/decision",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          decision: "approve",
          reason: "Receipt checked.",
        }),
      }),
    );
    expect(
      await screen.findByText(/decision saved · approved unpaid/i),
    ).toBeInTheDocument();
  });

  it("approves the same mock claim after linking and snapshots the current Sui Treasury", async () => {
    const workspaces: Array<
      PersistedWorkspace & { ownerUserId: string; externalReference: string }
    > = [];
    const repository = new MockClaimRepository({
      claims: new Map(),
      workspaces,
      receipts: new Map(),
      paymentAttempts: new Map(),
    });
    const submission: PersistedClaimSubmission = {
      externalReference: randomUUID(),
      workspace: {
        treasuryId: randomUUID(),
        externalReference: "unlinked-a1",
        name: "Unlinked A1",
        totalBudgetMinor: asMinorAmount(1_000),
        treasuryObjectId: null,
        categories: [
          {
            externalReference: "food",
            name: "Food",
            allocatedMinor: asMinorAmount(1_000),
            spentMinor: asMinorAmount(0),
          },
        ],
      },
      categoryExternalReference: "food",
      submitterName: "Member",
      merchant: "Cafe",
      description: "Refreshments",
      requestedAmountMinor: asMinorAmount(100),
      receiptAmountMinor: asMinorAmount(100),
      receiptReference: "A1-UNLINKED",
      recipientSuiAddress: demoSuiAddress,
      currency: "USDC",
    };
    const workspace = await repository.ensureWorkspace(submission);
    const created = await repository.createSubmittedClaim({
      submission,
      workspace,
      identity: repository.identity,
      receiptPath: "member/receipt.png",
      receiptHash: "a".repeat(64),
      receiptMimeType: "image/png",
      receiptSizeBytes: 128,
    });
    await repository.markManualReview(created.id, "Review required.");

    await expect(
      repository.getTreasuryLinkState(created.treasuryId),
    ).resolves.toEqual({ linked: false, treasuryObjectId: null });

    await expect(
      repository.decideClaim(created.id, "approve", "Approved."),
    ).rejects.toThrow(/link this treasury to Sui/i);
    await expect(
      repository.getActivePaymentAttemptForClaim(created.id),
    ).resolves.toBeNull();

    const linkedTreasuryObjectId =
      "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
    workspaces[0].treasuryObjectId = linkedTreasuryObjectId;

    await expect(repository.getClaim(created.id)).resolves.toMatchObject({
      id: created.id,
      treasuryObjectId: null,
      status: "under_review",
    });
    await expect(
      repository.getTreasuryLinkState(created.treasuryId),
    ).resolves.toEqual({
      linked: true,
      treasuryObjectId: linkedTreasuryObjectId,
    });
    const approved = await repository.decideClaim(
      created.id,
      "approve",
      "Approved after linking.",
    );
    expect(approved.treasuryObjectId).toBe(linkedTreasuryObjectId);
    expect(approved.approvedSnapshot?.treasuryObjectId).toBe(
      linkedTreasuryObjectId,
    );
  });
});

function unlinkedClaim() {
  return persistedClaimSchema.parse({
    id: "11111111-1111-4111-8111-111111111111",
    externalReference: "A1-UNLINKED-REVIEW",
    treasuryId: "22222222-2222-4222-8222-222222222222",
    categoryId: "33333333-3333-4333-8333-333333333333",
    categoryName: "Food",
    categoryExternalReference: "food",
    treasuryObjectId: null,
    memberWalletAddress: demoSuiAddress,
    recipientSuiAddress: demoSuiAddress,
    submitterName: "Member",
    merchant: "Cafe",
    description: "Refreshments",
    requestedAmountMinor: 100,
    receiptAmountMinor: 100,
    receiptReference: "A1-UNLINKED",
    receiptHash: "a".repeat(64),
    receiptMimeType: "image/png",
    receiptSizeBytes: 128,
    receiptAnalysis: null,
    duplicateMatch: { exactIds: [], similarIds: [] },
    recommendation: "review",
    recommendationReasons: ["Human review required."],
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
