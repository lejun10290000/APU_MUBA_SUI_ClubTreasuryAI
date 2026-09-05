import type {
  ApprovedPayoutSnapshot,
  PaymentAttempt,
  PreparePaymentResult,
} from "@/src/domain/stage6-payments";

export type PayoutClientPhase =
  | "ready"
  | "preparing"
  | "awaiting_signature"
  | "submitting"
  | "confirming"
  | "reconciliation_required"
  | "failed"
  | "paid";

export type PaymentReconciliationResult =
  | { state: "confirmed"; claim: unknown }
  | { state: "reconciliation_required"; attempt?: PaymentAttempt }
  | { state: "failed"; attempt?: PaymentAttempt };

export interface ApprovedClaimPayoutDependencies<TTransaction = unknown> {
  prepare(claimId: string): Promise<PreparePaymentResult>;
  preflight(attemptId: string): Promise<void>;
  authorize(
    snapshot: ApprovedPayoutSnapshot,
    treasurerCapObjectId: string,
  ): Promise<void>;
  build(
    snapshot: ApprovedPayoutSnapshot,
    treasurerCapObjectId: string,
  ): TTransaction;
  sign(
    transaction: TTransaction,
  ): Promise<{ bytes: string; signature: string }>;
  deriveDigest(signedTransactionBase64: string): Promise<string>;
  persistSignedSubmission(
    attemptId: string,
    evidence: {
      transactionDigest: string;
      treasurerCapObjectId: string;
      signedTransactionBase64: string;
    },
  ): Promise<PaymentAttempt>;
  broadcast(input: { bytes: string; signature: string }): Promise<unknown>;
  reconcile(attemptId: string): Promise<PaymentReconciliationResult>;
  onPhase?(phase: PayoutClientPhase): void;
}

export async function executeApprovedClaimPayout<TTransaction>(
  claimId: string,
  dependencies: ApprovedClaimPayoutDependencies<TTransaction>,
): Promise<PaymentReconciliationResult> {
  dependencies.onPhase?.("preparing");
  const { attempt, snapshot, treasurerCapObjectId } =
    await dependencies.prepare(claimId);

  if (attempt.transactionDigest) {
    dependencies.onPhase?.("confirming");
    try {
      return await dependencies.reconcile(attempt.id);
    } catch {
      return { state: "reconciliation_required", attempt };
    }
  }

  await dependencies.preflight(attempt.id);
  await dependencies.authorize(snapshot, treasurerCapObjectId);
  const transaction = dependencies.build(snapshot, treasurerCapObjectId);

  dependencies.onPhase?.("awaiting_signature");
  const signed = await dependencies.sign(transaction);
  const transactionDigest = await dependencies.deriveDigest(signed.bytes);

  dependencies.onPhase?.("submitting");
  await dependencies.persistSignedSubmission(attempt.id, {
    transactionDigest,
    treasurerCapObjectId,
    signedTransactionBase64: signed.bytes,
  });

  dependencies.onPhase?.("confirming");
  try {
    await dependencies.broadcast(signed);
  } catch {
    // Once the digest is persisted, a missing RPC response is ambiguous. Query
    // that exact digest instead of constructing or signing a replacement.
  }
  try {
    return await dependencies.reconcile(attempt.id);
  } catch {
    return { state: "reconciliation_required" };
  }
}
