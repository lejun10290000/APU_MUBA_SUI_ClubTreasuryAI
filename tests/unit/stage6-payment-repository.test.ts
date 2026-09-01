import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { asMinorAmount } from "@/src/domain/money";
import {
  demoSuiAddress,
  type PersistedClaimSubmission,
} from "@/src/domain/stage5-claims";
import {
  MockClaimRepository,
  resetMockClaimStore,
} from "@/src/lib/claims/mock-repository";

describe("Stage 6 payment repository", () => {
  beforeEach(() => resetMockClaimStore());

  it("prepares an approved-unpaid claim from its immutable payout snapshot", async () => {
    const repository = new MockClaimRepository();
    const claim = await createApprovedClaim(repository);

    const result = await repository.preparePaymentAttempt(claim.id);

    expect(result.snapshot).toEqual(claim.approvedSnapshot);
    expect(result.attempt).toMatchObject({
      claimId: claim.id,
      initiatedByUserId: repository.identity.userId,
      snapshot: claim.approvedSnapshot,
      treasurerCapObjectId: null,
      transactionDigest: null,
      status: "prepared",
      failureCode: null,
      confirmedAt: null,
    });
  });

  it("returns the same active attempt instead of creating a duplicate", async () => {
    const repository = new MockClaimRepository();
    const claim = await createApprovedClaim(repository);

    const first = await repository.preparePaymentAttempt(claim.id);
    const second = await repository.preparePaymentAttempt(claim.id);

    expect(second.attempt.id).toBe(first.attempt.id);
    await expect(
      repository.getActivePaymentAttemptForClaim(claim.id),
    ).resolves.toEqual(first.attempt);
    await expect(repository.getPaymentAttempt(first.attempt.id)).resolves.toEqual(
      first.attempt,
    );
  });

  it("rejects attempts for claims that are not approved and unpaid", async () => {
    const repository = new MockClaimRepository();
    const submission = makeSubmission();
    const workspace = await repository.ensureWorkspace(submission);
    const claim = await repository.createSubmittedClaim({
      submission,
      workspace,
      identity: repository.identity,
      receiptPath: "receipt",
      receiptHash: "b".repeat(64),
      receiptMimeType: "image/png",
      receiptSizeBytes: 128,
    });

    await expect(repository.preparePaymentAttempt(claim.id)).rejects.toThrow(
      "not eligible",
    );
  });

  it("persists the digest before submission and never allows replacement", async () => {
    const repository = new MockClaimRepository();
    const claim = await createApprovedClaim(repository);
    const { attempt } = await repository.preparePaymentAttempt(claim.id);
    const digest = "digest-12345678901234567890";

    await expect(
      repository.markPaymentAttemptSubmitted(attempt.id),
    ).rejects.toThrow("signed");
    const signed = await repository.markPaymentAttemptSigned(
      attempt.id,
      digest,
      demoSuiAddress,
    );
    expect(signed).toMatchObject({
      status: "signed",
      transactionDigest: digest,
      treasurerCapObjectId: demoSuiAddress,
    });
    await expect(
      repository.markPaymentAttemptSigned(
        attempt.id,
        "different-digest-1234567890",
        demoSuiAddress,
      ),
    ).rejects.toThrow("prepared");
    await expect(repository.markPaymentAttemptSubmitted(attempt.id)).resolves.toMatchObject(
      { status: "submitted", transactionDigest: digest },
    );
  });

  it("supports cancellation, failure, and digest-first reconciliation safely", async () => {
    const repository = new MockClaimRepository();
    const firstClaim = await createApprovedClaim(repository);
    const first = await repository.preparePaymentAttempt(firstClaim.id);
    await expect(
      repository.cancelPaymentAttempt(first.attempt.id, "wallet_rejected"),
    ).resolves.toMatchObject({
      status: "cancelled",
      failureCode: "wallet_rejected",
    });
    await expect(
      repository.markPaymentAttemptSubmitted(first.attempt.id),
    ).rejects.toThrow();

    const replacement = await repository.preparePaymentAttempt(firstClaim.id);
    await expect(
      repository.markPaymentAttemptFailed(replacement.attempt.id, "build_failed"),
    ).resolves.toMatchObject({ status: "failed", failureCode: "build_failed" });

    const third = await repository.preparePaymentAttempt(firstClaim.id);
    await repository.markPaymentAttemptSigned(
      third.attempt.id,
      "digest-reconcile-123456789012",
      demoSuiAddress,
    );
    await expect(
      repository.markPaymentAttemptReconciliationRequired(
        third.attempt.id,
        "rpc_timeout",
      ),
    ).resolves.toMatchObject({
      status: "reconciliation_required",
      transactionDigest: "digest-reconcile-123456789012",
    });
  });

  it("finalizes once from verified evidence and is idempotent for the same digest", async () => {
    const repository = new MockClaimRepository();
    const claim = await createApprovedClaim(repository);
    const { attempt } = await repository.preparePaymentAttempt(claim.id);
    const digest = "digest-confirmed-123456789012";
    await repository.markPaymentAttemptSigned(attempt.id, digest, demoSuiAddress);
    await repository.markPaymentAttemptSubmitted(attempt.id);
    const confirmation = {
      claimId: claim.id,
      attemptId: attempt.id,
      transactionDigest: digest,
      categoryRemainingMinor: asMinorAmount(6_500),
      treasuryBalanceMinor: asMinorAmount(6_500),
      confirmedAt: "2026-09-01T00:00:00.000Z",
    };

    const paid = await repository.finalizeConfirmedPayment(confirmation);
    expect(paid).toMatchObject({
      status: "paid",
      paymentStatus: "paid",
      confirmedTransactionDigest: digest,
      paidAt: confirmation.confirmedAt,
    });
    await expect(repository.finalizeConfirmedPayment(confirmation)).resolves.toEqual(
      paid,
    );
    await expect(
      repository.finalizeConfirmedPayment({
        ...confirmation,
        transactionDigest: "different-confirmed-digest-12345",
      }),
    ).rejects.toThrow("digest");
    await expect(repository.getPaymentAttempt(attempt.id)).resolves.toMatchObject({
      status: "confirmed",
      confirmedAt: confirmation.confirmedAt,
    });
  });

  it("does not finalize against mismatched chain remaining budget", async () => {
    const repository = new MockClaimRepository();
    const claim = await createApprovedClaim(repository);
    const { attempt } = await repository.preparePaymentAttempt(claim.id);
    const digest = "digest-mismatch-1234567890123";
    await repository.markPaymentAttemptSigned(attempt.id, digest, demoSuiAddress);
    await repository.markPaymentAttemptSubmitted(attempt.id);

    await expect(
      repository.finalizeConfirmedPayment({
        claimId: claim.id,
        attemptId: attempt.id,
        transactionDigest: digest,
        categoryRemainingMinor: asMinorAmount(6_499),
        treasuryBalanceMinor: asMinorAmount(6_500),
        confirmedAt: "2026-09-01T00:00:00.000Z",
      }),
    ).rejects.toThrow("budget state");
    await expect(repository.getClaim(claim.id)).resolves.toMatchObject({
      status: "approved_unpaid",
      paymentStatus: "unpaid",
    });
  });
});

async function createApprovedClaim(repository: MockClaimRepository) {
  const submission = makeSubmission();
  const workspace = await repository.ensureWorkspace(submission);
  const claim = await repository.createSubmittedClaim({
    submission,
    workspace,
    identity: repository.identity,
    receiptPath: `${repository.identity.userId}/${submission.externalReference}/receipt`,
    receiptHash: "a".repeat(64),
    receiptMimeType: "image/png",
    receiptSizeBytes: 128,
  });
  await repository.markManualReview(claim.id, "Treasurer review required.");
  return repository.decideClaim(
    claim.id,
    "approve",
    "Treasurer approved this synthetic claim.",
  );
}

function makeSubmission(): PersistedClaimSubmission {
  return {
    externalReference: randomUUID(),
    workspace: {
      externalReference: "stage6-test-workspace",
      name: "Stage 6 Test Treasury",
      totalBudgetMinor: asMinorAmount(10_000),
      treasuryObjectId: demoSuiAddress,
      categories: [
        {
          externalReference: "marketing",
          name: "Marketing",
          allocatedMinor: asMinorAmount(10_000),
          spentMinor: asMinorAmount(1_000),
        },
      ],
    },
    categoryExternalReference: "marketing",
    submitterName: "Aina Rahman",
    merchant: "Campus Print Shop",
    description: "Workshop printing",
    requestedAmountMinor: asMinorAmount(2_500),
    receiptAmountMinor: asMinorAmount(2_500),
    receiptReference: "STAGE6-RCP-001",
    recipientSuiAddress: demoSuiAddress,
    currency: "USDC",
  };
}
