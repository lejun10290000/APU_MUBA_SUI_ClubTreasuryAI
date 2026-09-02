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
import {
  prepareClaimPayment,
  reconcilePaymentAttempt,
  recordSignedPaymentSubmission,
  signedPaymentSubmissionSchema,
  type PaymentChainStatusProvider,
} from "@/src/lib/payments/contracts";

describe("Stage 6 payment API contracts", () => {
  beforeEach(() => resetMockClaimStore());

  it("prepares only the immutable approved payout snapshot", async () => {
    const repository = new MockClaimRepository();
    const claim = await approvedClaim(repository);

    const result = await prepareClaimPayment(repository, claim.id);

    expect(result).toEqual({
      attempt: expect.objectContaining({
        claimId: claim.id,
        status: "prepared",
      }),
      snapshot: claim.approvedSnapshot,
    });
  });

  it("validates signed evidence and persists the digest before submission", async () => {
    expect(() =>
      signedPaymentSubmissionSchema.parse({
        transactionDigest: "short",
        treasurerCapObjectId: "not-an-object-id",
        signedTransactionBase64: "bad",
      }),
    ).toThrow();
    expect(() =>
      signedPaymentSubmissionSchema.parse({
        transactionDigest: "digest-mainnet-12345678901234",
        treasurerCapObjectId: demoSuiAddress,
        signedTransactionBase64: "c2lnbmVkLXR4",
        network: "mainnet",
      }),
    ).toThrow();

    const repository = new MockClaimRepository();
    const claim = await approvedClaim(repository);
    const { attempt } = await prepareClaimPayment(repository, claim.id);
    const digest = "digest-submit-123456789012345";

    const submitted = await recordSignedPaymentSubmission(
      repository,
      attempt.id,
      {
        transactionDigest: digest,
        treasurerCapObjectId: demoSuiAddress,
        signedTransactionBase64: "c2lnbmVkLXR4",
        network: "testnet",
      },
      async () => digest,
    );

    expect(submitted).toMatchObject({
      status: "submitted",
      transactionDigest: digest,
    });
  });

  it("rejects a claimed digest that does not match the signed bytes", async () => {
    const repository = new MockClaimRepository();
    const claim = await approvedClaim(repository);
    const { attempt } = await prepareClaimPayment(repository, claim.id);

    await expect(
      recordSignedPaymentSubmission(
        repository,
        attempt.id,
        {
          transactionDigest: "digest-claimed-12345678901234",
          treasurerCapObjectId: demoSuiAddress,
          signedTransactionBase64: "c2lnbmVkLXR4",
        },
        async () => "digest-derived-12345678901234",
      ),
    ).rejects.toThrow(/does not match/i);
    await expect(
      repository.getPaymentAttempt(attempt.id),
    ).resolves.toMatchObject({
      status: "prepared",
      transactionDigest: null,
    });
  });

  it("reconciles by the already-persisted digest and finalizes verified success", async () => {
    const repository = new MockClaimRepository();
    const claim = await approvedClaim(repository);
    const { attempt } = await prepareClaimPayment(repository, claim.id);
    const digest = "digest-success-12345678901234";
    await recordSignedPaymentSubmission(
      repository,
      attempt.id,
      {
        transactionDigest: digest,
        treasurerCapObjectId: demoSuiAddress,
        signedTransactionBase64: "c2lnbmVkLXR4",
      },
      async () => digest,
    );
    const provider: PaymentChainStatusProvider = {
      getStatus: async (requestedDigest) => {
        expect(requestedDigest).toBe(digest);
        return {
          state: "success",
          transactionDigest: digest,
          categoryRemainingMinor: asMinorAmount(6_500),
          treasuryBalanceMinor: asMinorAmount(6_500),
          confirmedAt: "2026-09-01T00:00:00.000Z",
        };
      },
    };

    const result = await reconcilePaymentAttempt(
      repository,
      provider,
      attempt.id,
    );

    expect(result).toMatchObject({
      state: "confirmed",
      claim: {
        id: claim.id,
        status: "paid",
        confirmedTransactionDigest: digest,
      },
    });
  });

  it("keeps uncertain results recoverable without creating or replacing a digest", async () => {
    const repository = new MockClaimRepository();
    const claim = await approvedClaim(repository);
    const { attempt } = await prepareClaimPayment(repository, claim.id);
    const digest = "digest-pending-12345678901234";
    await recordSignedPaymentSubmission(
      repository,
      attempt.id,
      {
        transactionDigest: digest,
        treasurerCapObjectId: demoSuiAddress,
        signedTransactionBase64: "c2lnbmVkLXR4",
      },
      async () => digest,
    );
    const provider: PaymentChainStatusProvider = {
      getStatus: async () => ({ state: "pending", code: "rpc_timeout" }),
    };

    const result = await reconcilePaymentAttempt(
      repository,
      provider,
      attempt.id,
    );

    expect(result).toMatchObject({
      state: "reconciliation_required",
      attempt: { transactionDigest: digest, failureCode: "rpc_timeout" },
    });
  });

  it("records definitive chain failure without marking the claim paid", async () => {
    const repository = new MockClaimRepository();
    const claim = await approvedClaim(repository);
    const { attempt } = await prepareClaimPayment(repository, claim.id);
    const digest = "digest-failed-123456789012345";
    await recordSignedPaymentSubmission(
      repository,
      attempt.id,
      {
        transactionDigest: digest,
        treasurerCapObjectId: demoSuiAddress,
        signedTransactionBase64: "c2lnbmVkLXR4",
      },
      async () => digest,
    );
    const provider: PaymentChainStatusProvider = {
      getStatus: async () => ({
        state: "failure",
        code: "chain_execution_failed",
      }),
    };

    const result = await reconcilePaymentAttempt(
      repository,
      provider,
      attempt.id,
    );

    expect(result).toMatchObject({
      state: "failed",
      attempt: { status: "failed" },
    });
    await expect(repository.getClaim(claim.id)).resolves.toMatchObject({
      status: "approved_unpaid",
      paymentStatus: "unpaid",
    });
  });

  it("fails closed when chain evidence reports a different digest", async () => {
    const repository = new MockClaimRepository();
    const claim = await approvedClaim(repository);
    const { attempt } = await prepareClaimPayment(repository, claim.id);
    const digest = "digest-original-1234567890123";
    await recordSignedPaymentSubmission(
      repository,
      attempt.id,
      {
        transactionDigest: digest,
        treasurerCapObjectId: demoSuiAddress,
        signedTransactionBase64: "c2lnbmVkLXR4",
      },
      async () => digest,
    );
    const provider: PaymentChainStatusProvider = {
      getStatus: async () => ({
        state: "success",
        transactionDigest: "digest-other-1234567890123456",
        categoryRemainingMinor: asMinorAmount(6_500),
        treasuryBalanceMinor: asMinorAmount(6_500),
        confirmedAt: "2026-09-01T00:00:00.000Z",
      }),
    };

    const result = await reconcilePaymentAttempt(
      repository,
      provider,
      attempt.id,
    );

    expect(result).toMatchObject({
      state: "failed",
      attempt: { failureCode: "chain_result_digest_mismatch" },
    });
  });
});

async function approvedClaim(repository: MockClaimRepository) {
  const submission = submissionFixture();
  const workspace = await repository.ensureWorkspace(submission);
  const claim = await repository.createSubmittedClaim({
    submission,
    workspace,
    identity: repository.identity,
    receiptPath: `${repository.identity.userId}/${submission.externalReference}/receipt`,
    receiptHash: "c".repeat(64),
    receiptMimeType: "image/png",
    receiptSizeBytes: 128,
  });
  await repository.markManualReview(claim.id, "Treasurer review required.");
  return repository.decideClaim(claim.id, "approve", "Treasurer approved.");
}

function submissionFixture(): PersistedClaimSubmission {
  return {
    externalReference: randomUUID(),
    workspace: {
      externalReference: "stage6-api-workspace",
      name: "Stage 6 API Treasury",
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
    receiptReference: "API-RCP-001",
    recipientSuiAddress: demoSuiAddress,
    currency: "USDC",
  };
}
