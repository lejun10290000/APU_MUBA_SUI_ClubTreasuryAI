import {
  persistedClaimSchema,
  type PersistedClaim,
} from "@/src/domain/stage5-claims";
import type {
  BudgetCategoryRow,
  ClaimRow,
} from "@/src/lib/supabase/database.types";

export function mapClaimRow(
  row: ClaimRow,
  category: Pick<BudgetCategoryRow, "name" | "external_reference">,
): PersistedClaim {
  const duplicateMatch = parseDuplicateMatch(row.duplicate_match);
  const recommendationReasons = Array.isArray(row.recommendation_reasons)
    ? row.recommendation_reasons.filter(
        (reason): reason is string => typeof reason === "string",
      )
    : [];
  const approvedSnapshot =
    (row.status === "approved_unpaid" || row.status === "paid") &&
    row.approved_treasury_object_id &&
    row.approved_category_reference &&
    row.approved_recipient_sui_address &&
    row.approved_amount_minor !== null &&
    row.approved_currency
      ? {
          treasuryObjectId: row.approved_treasury_object_id,
          categoryReference: row.approved_category_reference,
          recipientSuiAddress: row.approved_recipient_sui_address,
          amountMinor: row.approved_amount_minor,
          currency: row.approved_currency,
        }
      : null;

  return persistedClaimSchema.parse({
    id: row.id,
    externalReference: row.external_reference,
    treasuryId: row.treasury_id,
    categoryId: row.category_id,
    categoryName: category.name,
    categoryExternalReference: category.external_reference,
    treasuryObjectId: row.treasury_object_id,
    memberWalletAddress: row.member_wallet_address,
    recipientSuiAddress: row.recipient_sui_address,
    submitterName: row.submitter_name,
    merchant: row.merchant,
    description: row.description,
    requestedAmountMinor: row.requested_amount_minor,
    receiptAmountMinor: row.receipt_amount_minor,
    receiptReference: row.receipt_reference,
    receiptHash: row.receipt_hash,
    receiptMimeType: row.receipt_mime_type,
    receiptSizeBytes: row.receipt_size_bytes,
    receiptAnalysis: row.receipt_analysis,
    duplicateMatch,
    recommendation: row.recommendation,
    recommendationReasons,
    status: row.status,
    decision: row.decision,
    decisionReason: row.decision_reason,
    paymentStatus: row.payment_status,
    approvedSnapshot,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    confirmedTransactionDigest: row.confirmed_transaction_digest,
    paidAt: row.paid_at,
  });
}

function parseDuplicateMatch(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { exactIds: [], similarIds: [] };
  }
  const record = value as Record<string, unknown>;
  return {
    exactIds: stringArray(record.exactIds),
    similarIds: stringArray(record.similarIds),
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
