import { describe, expect, it, vi } from "vitest";
import { asMinorAmount } from "@/src/domain/money";
import type {
  ApprovedPayoutSnapshot,
  PaymentAttempt,
} from "@/src/domain/stage6-payments";
import { executeApprovedClaimPayout } from "@/src/lib/payments/client-flow";

const snapshot: ApprovedPayoutSnapshot = {
  treasuryObjectId:
    "0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4",
  categoryReference: "events",
  recipientSuiAddress:
    "0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560",
  amountMinor: asMinorAmount(10),
  currency: "USDC",
};

const preparedAttempt: PaymentAttempt = {
  id: "4e2e03a8-7acc-4ce4-a054-05e588134379",
  claimId: "855dc49e-c8ba-4d9e-a20b-97c3cc1ad86f",
  initiatedByUserId: "f97baad8-49e5-4488-9f42-b9e63e805e20",
  snapshot,
  treasurerCapObjectId: null,
  transactionDigest: null,
  status: "prepared",
  failureCode: null,
  createdAt: "2026-09-02T00:00:00.000Z",
  updatedAt: "2026-09-02T00:00:00.000Z",
  confirmedAt: null,
};

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    prepare: vi.fn().mockResolvedValue({ attempt: preparedAttempt, snapshot }),
    preflight: vi.fn().mockResolvedValue(undefined),
    authorize: vi.fn().mockResolvedValue({
      treasurerCapObjectId:
        "0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7",
    }),
    build: vi.fn().mockReturnValue({ kind: "unsigned-payout" }),
    sign: vi
      .fn()
      .mockResolvedValue({ bytes: "c2lnbmVkLXR4", signature: "sig" }),
    deriveDigest: vi.fn().mockResolvedValue("digest-signed-transaction-12345"),
    persistSignedSubmission: vi.fn().mockResolvedValue({
      ...preparedAttempt,
      status: "submitted",
      transactionDigest: "digest-signed-transaction-12345",
    }),
    broadcast: vi.fn().mockResolvedValue(undefined),
    reconcile: vi
      .fn()
      .mockResolvedValue({ state: "confirmed", claim: { status: "paid" } }),
    onPhase: vi.fn(),
    ...overrides,
  };
}

describe("approved claim payout client flow", () => {
  it("fails before building or signing when the server preflight reports a Supabase-to-Sui mismatch", async () => {
    const deps = dependencies({
      preflight: vi
        .fn()
        .mockRejectedValue(
          new Error(
            "Payout consistency check failed: persisted and Sui category remaining differ.",
          ),
        ),
    });

    await expect(
      executeApprovedClaimPayout(preparedAttempt.claimId, deps),
    ).rejects.toThrow(/persisted and Sui category remaining differ/i);

    expect(deps.preflight).toHaveBeenCalledWith(preparedAttempt.id);
    expect(deps.authorize).not.toHaveBeenCalled();
    expect(deps.build).not.toHaveBeenCalled();
    expect(deps.sign).not.toHaveBeenCalled();
    expect(deps.deriveDigest).not.toHaveBeenCalled();
    expect(deps.persistSignedSubmission).not.toHaveBeenCalled();
    expect(deps.broadcast).not.toHaveBeenCalled();
    expect(deps.reconcile).not.toHaveBeenCalled();
  });

  it("builds only from the immutable prepared snapshot and persists its digest before broadcast", async () => {
    const deps = dependencies();

    await executeApprovedClaimPayout(preparedAttempt.claimId, deps);

    expect(deps.authorize).toHaveBeenCalledWith(snapshot);
    expect(deps.build).toHaveBeenCalledWith(snapshot);
    expect(deps.persistSignedSubmission).toHaveBeenCalledWith(
      preparedAttempt.id,
      {
        transactionDigest: "digest-signed-transaction-12345",
        signedTransactionBase64: "c2lnbmVkLXR4",
        treasurerCapObjectId:
          "0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7",
      },
    );
    expect(
      deps.persistSignedSubmission.mock.invocationCallOrder[0],
    ).toBeLessThan(deps.broadcast.mock.invocationCallOrder[0]);
    expect(deps.broadcast).toHaveBeenCalledWith({
      bytes: "c2lnbmVkLXR4",
      signature: "sig",
    });
  });

  it("does not persist, broadcast, reconcile, or report paid when the wallet rejects signing", async () => {
    const deps = dependencies({
      sign: vi.fn().mockRejectedValue(new Error("User rejected")),
    });

    await expect(
      executeApprovedClaimPayout(preparedAttempt.claimId, deps),
    ).rejects.toThrow("User rejected");

    expect(deps.persistSignedSubmission).not.toHaveBeenCalled();
    expect(deps.broadcast).not.toHaveBeenCalled();
    expect(deps.reconcile).not.toHaveBeenCalled();
  });

  it("reconciles an existing persisted digest instead of signing a replacement transaction", async () => {
    const submitted = {
      ...preparedAttempt,
      status: "reconciliation_required" as const,
      transactionDigest: "digest-existing-transaction-12345",
    };
    const deps = dependencies({
      prepare: vi.fn().mockResolvedValue({ attempt: submitted, snapshot }),
      reconcile: vi
        .fn()
        .mockResolvedValue({ state: "reconciliation_required" }),
    });

    const result = await executeApprovedClaimPayout(
      preparedAttempt.claimId,
      deps,
    );

    expect(result).toEqual({ state: "reconciliation_required" });
    expect(deps.preflight).not.toHaveBeenCalled();
    expect(deps.authorize).not.toHaveBeenCalled();
    expect(deps.sign).not.toHaveBeenCalled();
    expect(deps.broadcast).not.toHaveBeenCalled();
    expect(deps.reconcile).toHaveBeenCalledWith(preparedAttempt.id);
  });

  it("reconciles the persisted digest after an ambiguous broadcast error", async () => {
    const deps = dependencies({
      broadcast: vi.fn().mockRejectedValue(new Error("RPC response lost")),
      reconcile: vi
        .fn()
        .mockResolvedValue({ state: "reconciliation_required" }),
    });

    const result = await executeApprovedClaimPayout(
      preparedAttempt.claimId,
      deps,
    );

    expect(result).toEqual({ state: "reconciliation_required" });
    expect(deps.reconcile).toHaveBeenCalledWith(preparedAttempt.id);
  });

  it("keeps the persisted digest recoverable when reconciliation itself is interrupted", async () => {
    const deps = dependencies({
      reconcile: vi.fn().mockRejectedValue(new Error("database unavailable")),
    });

    await expect(
      executeApprovedClaimPayout(preparedAttempt.claimId, deps),
    ).resolves.toEqual({ state: "reconciliation_required" });
    expect(deps.persistSignedSubmission).toHaveBeenCalledOnce();
    expect(deps.broadcast).toHaveBeenCalledOnce();
  });
});
