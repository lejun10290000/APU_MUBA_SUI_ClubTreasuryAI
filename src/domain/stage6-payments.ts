import type { MinorAmount } from "./money";
import type { PersistedClaim } from "./stage5-claims";

export type PaymentAttemptStatus =
  | "prepared"
  | "signed"
  | "submitted"
  | "confirmed"
  | "cancelled"
  | "failed"
  | "reconciliation_required";

const ACTIVE_PAYMENT_ATTEMPT_STATUSES = new Set<PaymentAttemptStatus>([
  "prepared",
  "signed",
  "submitted",
  "reconciliation_required",
]);

export interface ApprovedPayoutSnapshot {
  treasuryObjectId: string;
  categoryReference: string;
  recipientSuiAddress: string;
  amountMinor: MinorAmount;
  currency: "USDC";
}

export interface PaymentAttempt {
  id: string;
  claimId: string;
  initiatedByUserId: string;
  snapshot: ApprovedPayoutSnapshot;
  treasurerCapObjectId: string | null;
  transactionDigest: string | null;
  status: PaymentAttemptStatus;
  failureCode: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
}

export interface PreparePaymentResult {
  attempt: PaymentAttempt;
  snapshot: ApprovedPayoutSnapshot;
}

export interface ConfirmedPaymentInput {
  claimId: string;
  attemptId: string;
  transactionDigest: string;
  categoryRemainingMinor: MinorAmount;
  treasuryBalanceMinor: MinorAmount;
  confirmedAt: string;
}

export function isActivePaymentAttemptStatus(
  status: PaymentAttemptStatus,
): boolean {
  return ACTIVE_PAYMENT_ATTEMPT_STATUSES.has(status);
}

export function parseApprovedPayoutSnapshot(
  claim: PersistedClaim,
): ApprovedPayoutSnapshot {
  if (
    claim.status !== "approved_unpaid" ||
    claim.decision !== "approve" ||
    claim.paymentStatus !== "unpaid"
  ) {
    throw new Error("Claim is not eligible for payment.");
  }

  const snapshot = claim.approvedSnapshot;
  if (!snapshot) {
    throw new Error("Approved payout snapshot is missing.");
  }

  if (snapshot.currency !== "USDC") {
    throw new Error("Approved payout snapshot must use USDC.");
  }

  return {
    treasuryObjectId: snapshot.treasuryObjectId,
    categoryReference: snapshot.categoryReference,
    recipientSuiAddress: snapshot.recipientSuiAddress,
    amountMinor: snapshot.amountMinor,
    currency: "USDC",
  };
}
