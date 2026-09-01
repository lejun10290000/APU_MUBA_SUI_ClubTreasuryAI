import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";
import { z } from "zod";
import { asMinorAmount, type MinorAmount } from "@/src/domain/money";
import type { Stage6ClaimRepository } from "@/src/lib/claims";

export const routeIdSchema = z.string().uuid();

export const transactionDigestSchema = z
  .string()
  .trim()
  .min(20, "Transaction digest is too short.")
  .max(200, "Transaction digest is too long.");

export const signedPaymentSubmissionSchema = z.object({
  transactionDigest: transactionDigestSchema,
  treasurerCapObjectId: z
    .string()
    .trim()
    .refine(isValidSuiAddress, "TreasurerCap object ID is invalid.")
    .transform((value) => normalizeSuiAddress(value)),
  signedTransactionBase64: z
    .string()
    .trim()
    .min(8, "Signed transaction artifact is missing.")
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, "Signed transaction artifact is invalid."),
  network: z.literal("testnet").optional(),
});

export type SignedPaymentSubmission = z.infer<
  typeof signedPaymentSubmissionSchema
>;

export type PaymentChainStatus =
  | {
      state: "success";
      transactionDigest: string;
      categoryRemainingMinor: MinorAmount;
      treasuryBalanceMinor: MinorAmount;
      confirmedAt: string;
    }
  | { state: "pending"; code: string }
  | { state: "failure"; code: string };

export interface PaymentChainStatusProvider {
  getStatus(transactionDigest: string): Promise<PaymentChainStatus>;
}

export async function prepareClaimPayment(
  repository: Stage6ClaimRepository,
  claimId: string,
) {
  return repository.preparePaymentAttempt(routeIdSchema.parse(claimId));
}

export async function recordSignedPaymentSubmission(
  repository: Stage6ClaimRepository,
  attemptId: string,
  input: SignedPaymentSubmission,
) {
  const parsedAttemptId = routeIdSchema.parse(attemptId);
  const evidence = signedPaymentSubmissionSchema.parse(input);
  await repository.markPaymentAttemptSigned(
    parsedAttemptId,
    evidence.transactionDigest,
    evidence.treasurerCapObjectId,
  );
  return repository.markPaymentAttemptSubmitted(parsedAttemptId);
}

export async function reconcilePaymentAttempt(
  repository: Stage6ClaimRepository,
  chainStatusProvider: PaymentChainStatusProvider,
  attemptId: string,
) {
  const parsedAttemptId = routeIdSchema.parse(attemptId);
  const attempt = await repository.getPaymentAttempt(parsedAttemptId);
  if (!attempt) throw new Error("Payment attempt not found.");
  if (!attempt.transactionDigest) {
    throw new Error("Payment attempt has no persisted transaction digest.");
  }

  const chainStatus = await chainStatusProvider.getStatus(
    attempt.transactionDigest,
  );
  if (chainStatus.state === "pending") {
    return {
      state: "reconciliation_required" as const,
      attempt: await repository.markPaymentAttemptReconciliationRequired(
        attempt.id,
        chainStatus.code,
      ),
    };
  }
  if (chainStatus.state === "failure") {
    return {
      state: "failed" as const,
      attempt: await repository.markPaymentAttemptFailed(
        attempt.id,
        chainStatus.code,
      ),
    };
  }
  if (chainStatus.transactionDigest !== attempt.transactionDigest) {
    return {
      state: "failed" as const,
      attempt: await repository.markPaymentAttemptFailed(
        attempt.id,
        "chain_result_digest_mismatch",
      ),
    };
  }
  return {
    state: "confirmed" as const,
    claim: await repository.finalizeConfirmedPayment({
      claimId: attempt.claimId,
      attemptId: attempt.id,
      transactionDigest: attempt.transactionDigest,
      categoryRemainingMinor: asMinorAmount(
        chainStatus.categoryRemainingMinor,
      ),
      treasuryBalanceMinor: asMinorAmount(chainStatus.treasuryBalanceMinor),
      confirmedAt: chainStatus.confirmedAt,
    }),
  };
}
