import { describe, expect, it, vi } from "vitest";

import { asMinorAmount } from "@/src/domain/money";
import type {
  ApprovedPayoutSnapshot,
  PaymentAttempt,
} from "@/src/domain/stage6-payments";
import { executeApprovedClaimPayout } from "@/src/lib/payments/client-flow";
import { resolveWorkspaceTreasurerCap } from "@/src/lib/payments/workspace-authorization";

const capA = `0x${"1".repeat(64)}`;
const treasuryB = `0x${"b".repeat(64)}`;
const capB = `0x${"2".repeat(64)}`;

describe("A2 per-workspace TreasurerCap payout", () => {
  it("resolves Cap B only from claim workspace B", () => {
    expect(
      resolveWorkspaceTreasurerCap({
        claimTreasuryId: "workspace-b",
        approvedTreasuryObjectId: treasuryB,
        treasury: activeTreasury("workspace-b", treasuryB, capB),
      }),
    ).toBe(capB);
    expect(capB).not.toBe(capA);
  });

  it("blocks missing or incomplete activation metadata without a global fallback", () => {
    expect(() =>
      resolveWorkspaceTreasurerCap({
        claimTreasuryId: "workspace-b",
        approvedTreasuryObjectId: treasuryB,
        treasury: {
          ...activeTreasury("workspace-b", treasuryB, capB),
          suiTreasurerCapObjectId: null,
        },
      }),
    ).toThrow(/TreasurerCap|activation/i);
  });

  it("passes the server-prepared workspace Cap through authorization, build, and digest persistence", async () => {
    const snapshot: ApprovedPayoutSnapshot = {
      treasuryObjectId: treasuryB,
      categoryReference: "events",
      recipientSuiAddress: `0x${"3".repeat(64)}`,
      amountMinor: asMinorAmount(10),
      currency: "USDC",
    };
    const attempt: PaymentAttempt = {
      id: "11111111-1111-4111-8111-111111111111",
      claimId: "22222222-2222-4222-8222-222222222222",
      initiatedByUserId: "33333333-3333-4333-8333-333333333333",
      snapshot,
      treasurerCapObjectId: null,
      transactionDigest: null,
      status: "prepared",
      failureCode: null,
      createdAt: "2026-09-05T00:00:00.000Z",
      updatedAt: "2026-09-05T00:00:00.000Z",
      confirmedAt: null,
    };
    const authorize = vi.fn().mockResolvedValue(undefined);
    const build = vi.fn().mockReturnValue({ kind: "payout" });
    const persistSignedSubmission = vi.fn().mockResolvedValue({
      ...attempt,
      status: "submitted",
      treasurerCapObjectId: capB,
      transactionDigest: "digest-a2-workspace-cap-12345",
    });

    await executeApprovedClaimPayout(attempt.claimId, {
      prepare: vi.fn().mockResolvedValue({
        attempt,
        snapshot,
        treasurerCapObjectId: capB,
      }),
      preflight: vi.fn().mockResolvedValue(undefined),
      authorize,
      build,
      sign: vi.fn().mockResolvedValue({ bytes: "c2lnbmVkLXR4", signature: "sig" }),
      deriveDigest: vi.fn().mockResolvedValue("digest-a2-workspace-cap-12345"),
      persistSignedSubmission,
      broadcast: vi.fn().mockResolvedValue(undefined),
      reconcile: vi.fn().mockResolvedValue({ state: "confirmed", claim: { status: "paid" } }),
    });

    expect(authorize).toHaveBeenCalledWith(snapshot, capB);
    expect(build).toHaveBeenCalledWith(snapshot, capB);
    expect(persistSignedSubmission).toHaveBeenCalledWith(attempt.id, {
      transactionDigest: "digest-a2-workspace-cap-12345",
      treasurerCapObjectId: capB,
      signedTransactionBase64: "c2lnbmVkLXR4",
    });
  });
});

function activeTreasury(
  id: string,
  suiTreasuryObjectId: string,
  suiTreasurerCapObjectId: string,
) {
  return {
    id,
    status: "active",
    suiActivationStatus: "active",
    suiTreasuryObjectId,
    suiTreasurerCapObjectId,
  } as const;
}
