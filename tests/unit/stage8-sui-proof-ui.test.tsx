import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { persistedClaimSchema } from "@/src/domain/stage5-claims";
import { ClaimPayoutView } from "@/src/components/claim-payout-panel";
import { HistoryPanel } from "@/src/components/history-panel";

vi.mock("@mysten/dapp-kit-react", () => ({
  useCurrentAccount: () => null,
  useCurrentClient: () => ({}),
  useCurrentNetwork: () => "testnet",
  useDAppKit: () => ({}),
}));

const digest = "9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        history: [
          {
            claimId: "paid-1",
            treasuryName: "Web3 Workshop Demo",
            categoryName: "Food",
            amountMinor: 10,
            recipient: `0x${"2".repeat(64)}`,
            digest,
            confirmedAt: "2026-09-05T08:00:00.000Z",
          },
        ],
      }),
    } as Response),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("explains confirmed History as treasurer-signed treasury-to-member proof", async () => {
  render(<HistoryPanel />);
  expect(
    await screen.findByText(/Treasurer signed → Treasury paid → Member received/i),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /View on SuiVision/i })).toHaveAttribute(
    "href",
    expect.stringContaining("suivision.xyz"),
  );
});

it("shows SuiVision proof only after a payout is persisted as paid", () => {
  const claim = persistedClaimSchema.parse({
    id: "69a20a42-ae58-4547-b2f5-28bb2de52262",
    externalReference: "STAGE8-PAID-001",
    treasuryId: "355fbe92-9e46-41be-8b08-620d01e119ec",
    categoryId: "a55fbe92-9e46-41be-8b08-620d01e119ec",
    categoryName: "Food",
    categoryExternalReference: "food",
    treasuryObjectId: `0x${"a".repeat(64)}`,
    memberWalletAddress: `0x${"2".repeat(64)}`,
    recipientSuiAddress: `0x${"2".repeat(64)}`,
    submitterName: "Member",
    merchant: "Campus Cafe",
    description: "Food",
    requestedAmountMinor: 10,
    receiptAmountMinor: 10,
    receiptReference: "CAFE-1001",
    receiptHash: "d".repeat(64),
    receiptMimeType: "image/png",
    receiptSizeBytes: 128,
    receiptAnalysis: null,
    duplicateMatch: { exactIds: [], similarIds: [] },
    recommendation: "approve",
    recommendationReasons: [],
    status: "paid",
    decision: "approve",
    decisionReason: "Verified",
    paymentStatus: "paid",
    approvedSnapshot: {
      treasuryObjectId: `0x${"a".repeat(64)}`,
      categoryReference: "food",
      recipientSuiAddress: `0x${"2".repeat(64)}`,
      amountMinor: 10,
      currency: "USDC",
    },
    createdAt: "2026-09-05T07:00:00.000Z",
    decidedAt: "2026-09-05T07:10:00.000Z",
    confirmedTransactionDigest: digest,
    paidAt: "2026-09-05T08:00:00.000Z",
  });
  render(
    <ClaimPayoutView claim={claim} phase="paid" onAction={() => undefined} />,
  );
  expect(screen.getByText(/Treasurer signed → Treasury paid → Member received/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /View on SuiVision/i })).toBeInTheDocument();
});
