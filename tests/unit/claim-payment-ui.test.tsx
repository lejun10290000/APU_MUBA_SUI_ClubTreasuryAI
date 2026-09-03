import { randomUUID } from "node:crypto";
import { cleanup, render, screen } from "@testing-library/react";
import { toBase58 } from "@mysten/sui/utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClaimPayoutView } from "@/src/components/claim-payout-panel";
import {
  demoSuiAddress,
  persistedClaimSchema,
} from "@/src/domain/stage5-claims";

const digest = toBase58(new Uint8Array(32).fill(7));

afterEach(cleanup);

describe("approved claim payout UI", () => {
  it("shows the immutable payout snapshot and an explicit payment control only when approved and unpaid", () => {
    const claim = approvedClaim();
    const { rerender } = render(
      <ClaimPayoutView claim={claim} onAction={vi.fn()} phase="ready" />,
    );

    expect(
      screen.getByRole("button", { name: /pay approved claim/i }),
    ).toBeEnabled();
    expect(screen.getByText("0.10 USDC")).toBeInTheDocument();
    expect(screen.getByText("events")).toBeInTheDocument();
    expect(
      screen.getByText(claim.approvedSnapshot!.recipientSuiAddress),
    ).toBeInTheDocument();

    rerender(
      <ClaimPayoutView
        claim={approvedClaim({
          status: "rejected",
          decision: "reject",
          approvedSnapshot: null,
        })}
        onAction={vi.fn()}
        phase="ready"
      />,
    );
    expect(
      screen.queryByRole("button", { name: /pay approved claim/i }),
    ).not.toBeInTheDocument();
  });

  it("never labels a submitted or uncertain transaction as paid", () => {
    const { rerender } = render(
      <ClaimPayoutView
        claim={approvedClaim()}
        onAction={vi.fn()}
        phase="confirming"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Confirming on Sui Testnet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.queryByText(/^Paid$/)).not.toBeInTheDocument();

    rerender(
      <ClaimPayoutView
        claim={approvedClaim()}
        onAction={vi.fn()}
        phase="reconciliation_required"
      />,
    );
    expect(
      screen.getByRole("button", { name: /reconcile existing transaction/i }),
    ).toBeEnabled();
    expect(
      screen.getByText(
        /checks the existing digest and never requests a replacement signature/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Paid$/)).not.toBeInTheDocument();
  });

  it("explains that a pre-sign failure is safe to retry without implying a payment occurred", () => {
    render(
      <ClaimPayoutView
        claim={approvedClaim()}
        error="Payout consistency check failed: persisted and Sui category remaining differ."
        onAction={vi.fn()}
        phase="failed"
      />,
    );

    expect(
      screen.getByText(/no transaction was signed or submitted/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /refresh the authoritative treasury data before retrying/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows confirmed digest evidence and removes the payout action after payment", () => {
    render(
      <ClaimPayoutView
        claim={approvedClaim({
          status: "paid",
          paymentStatus: "paid",
          confirmedTransactionDigest: digest,
          paidAt: "2026-09-02T08:30:00.000Z",
        })}
        onAction={vi.fn()}
        phase="paid"
      />,
    );

    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view on sui testnet explorer/i }),
    ).toHaveAttribute("href", expect.stringContaining(digest));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

function approvedClaim(overrides: Record<string, unknown> = {}) {
  return persistedClaimSchema.parse({
    id: randomUUID(),
    externalReference: "STAGE6-EVENT-007",
    treasuryId: randomUUID(),
    categoryId: randomUUID(),
    categoryName: "Events",
    categoryExternalReference: "events",
    treasuryObjectId: demoSuiAddress,
    memberWalletAddress: demoSuiAddress,
    recipientSuiAddress: demoSuiAddress,
    submitterName: "Demo Member",
    merchant: "Campus Event Store",
    description: "Event supplies",
    requestedAmountMinor: 10,
    receiptAmountMinor: 10,
    receiptReference: "EVENT-007",
    receiptHash: "a".repeat(64),
    receiptMimeType: "image/png",
    receiptSizeBytes: 128,
    receiptAnalysis: null,
    duplicateMatch: { exactIds: [], similarIds: [] },
    recommendation: "approve",
    recommendationReasons: ["All deterministic checks passed."],
    status: "approved_unpaid",
    decision: "approve",
    decisionReason: "Treasurer approved.",
    paymentStatus: "unpaid",
    approvedSnapshot: {
      treasuryObjectId:
        "0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4",
      categoryReference: "events",
      recipientSuiAddress:
        "0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560",
      amountMinor: 10,
      currency: "USDC",
    },
    createdAt: "2026-09-02T08:00:00.000Z",
    decidedAt: "2026-09-02T08:10:00.000Z",
    confirmedTransactionDigest: null,
    paidAt: null,
    ...overrides,
  });
}
