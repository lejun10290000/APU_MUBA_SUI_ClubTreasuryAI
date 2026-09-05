import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DuplicateClaimCandidate } from "@/src/domain/claim-rules";
import { asMinorAmount } from "@/src/domain/money";
import type { ReceiptMimeType } from "@/src/domain/receipt-evidence";
import type {
  PersistedClaim,
  PersistedClaimSubmission,
} from "@/src/domain/stage5-claims";
import { serverConfig } from "@/src/config/env";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import type {
  ClaimPaymentAttemptRow,
  BudgetCategoryRow,
  ClaimRow,
  Database,
} from "@/src/lib/supabase/database.types";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { mapClaimRow } from "./map-claim";
import type {
  ConfirmedPaymentInput,
  PaymentAttempt,
} from "@/src/domain/stage6-payments";
import type {
  ClaimIdentity,
  FinalClaimReview,
  PersistedWorkspace,
  Stage6ClaimRepository,
  SubmittedClaimInsert,
  TreasuryLinkState,
} from "./types";

type TypedClient = SupabaseClient<Database>;

export class SupabaseClaimRepository implements Stage6ClaimRepository {
  constructor(
    readonly identity: ClaimIdentity,
    private readonly userClient: TypedClient,
    private readonly adminClient: TypedClient,
  ) {}

  async findByExternalReference(reference: string) {
    const { data, error } = await this.userClient
      .from("claims")
      .select("*")
      .eq("external_reference", reference)
      .maybeSingle();
    if (error) throw error;
    return data ? this.hydrate(data) : null;
  }

  async ensureWorkspace(
    submission: PersistedClaimSubmission,
  ): Promise<PersistedWorkspace> {
    const selected = submission.workspace.categories.find(
      (category) =>
        category.externalReference === submission.categoryExternalReference,
    );
    if (!selected) {
      throw new Error("Choose a category from the active treasury budget.");
    }

    const { data: treasury, error: lookupError } = await this.userClient
      .from("treasuries")
      .select("*")
      .eq("id", submission.workspace.treasuryId)
      .eq("status", "active")
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!treasury) {
      throw new Error("The selected treasury is not accessible.");
    }
    if (
      treasury.external_reference !== submission.workspace.externalReference ||
      treasury.name !== submission.workspace.name ||
      treasury.total_budget_minor !== submission.workspace.totalBudgetMinor ||
      treasury.sui_treasury_object_id !== submission.workspace.treasuryObjectId
    ) {
      throw new Error(
        "The selected treasury changed. Reload it and try again.",
      );
    }

    const { data: membership, error: membershipError } = await this.userClient
      .from("treasury_members")
      .select("treasury_id,role")
      .eq("treasury_id", treasury.id)
      .eq("user_id", this.identity.userId)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership && treasury.owner_user_id !== this.identity.userId) {
      throw new Error("Treasury membership is required to submit this claim.");
    }
    const { data: categories, error: categoryError } = await this.userClient
      .from("budget_categories")
      .select("*")
      .eq("treasury_id", treasury.id)
      .order("created_at", { ascending: true });
    if (categoryError) throw categoryError;
    const category = categories.find(
      (candidate) =>
        candidate.external_reference === selected.externalReference,
    );
    if (!category) {
      throw new Error("Choose a category from the active treasury budget.");
    }
    if (
      category.name !== selected.name ||
      category.allocated_minor !== selected.allocatedMinor ||
      category.spent_minor !== selected.spentMinor
    ) {
      throw new Error(
        "The selected budget category changed. Reload it and try again.",
      );
    }

    return {
      treasuryId: treasury.id,
      categoryId: category.id,
      categoryName: category.name,
      categoryExternalReference: category.external_reference,
      categoryAllocatedMinor: asMinorAmount(category.allocated_minor),
      categorySpentMinor: asMinorAmount(category.spent_minor),
      treasuryObjectId: treasury.sui_treasury_object_id,
    };
  }

  async uploadReceipt(
    path: string,
    bytes: Uint8Array,
    mimeType: ReceiptMimeType,
  ) {
    const { error } = await this.userClient.storage
      .from(serverConfig.SUPABASE_RECEIPTS_BUCKET)
      .upload(path, bytes, { contentType: mimeType, upsert: false });
    if (error) throw error;
  }

  async deleteReceipt(path: string) {
    const { error } = await this.adminClient.storage
      .from(serverConfig.SUPABASE_RECEIPTS_BUCKET)
      .remove([path]);
    if (error) throw error;
  }

  async createSubmittedClaim(input: SubmittedClaimInsert) {
    const { data, error } = await this.userClient
      .from("claims")
      .insert({
        external_reference: input.submission.externalReference,
        treasury_id: input.workspace.treasuryId,
        category_id: input.workspace.categoryId,
        treasury_object_id: input.workspace.treasuryObjectId,
        member_user_id: input.identity.userId,
        member_wallet_address: input.identity.walletAddress,
        recipient_sui_address: input.identity.walletAddress,
        submitter_name: input.submission.submitterName,
        merchant: input.submission.merchant,
        description: input.submission.description,
        requested_amount_minor: input.submission.requestedAmountMinor,
        receipt_amount_minor: input.submission.receiptAmountMinor,
        currency: "USDC",
        receipt_reference: input.submission.receiptReference,
        receipt_path: input.receiptPath,
        receipt_hash: input.receiptHash,
        receipt_mime_type: input.receiptMimeType,
        receipt_size_bytes: input.receiptSizeBytes,
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapClaimRow(data, {
      name: input.workspace.categoryName,
      external_reference: input.workspace.categoryExternalReference,
    });
  }

  async findDuplicateCandidates(
    treasuryId: string,
    excludedClaimId: string,
  ): Promise<DuplicateClaimCandidate[]> {
    const { data, error } = await this.adminClient
      .from("claims")
      .select(
        "id,merchant,receipt_reference,receipt_hash,requested_amount_minor",
      )
      .eq("treasury_id", treasuryId)
      .neq("id", excludedClaimId);
    if (error) throw error;
    return data.map((claim) => ({
      id: claim.id,
      merchant: claim.merchant,
      receiptReference: claim.receipt_reference,
      receiptHash: claim.receipt_hash,
      requestedAmountMinor: asMinorAmount(claim.requested_amount_minor),
    }));
  }

  async finalizeReview(claimId: string, review: FinalClaimReview) {
    const { data, error } = await this.adminClient
      .from("claims")
      .update({
        receipt_amount_minor: review.receiptAmountMinor,
        receipt_analysis: review.receiptAnalysis,
        duplicate_match: {
          exactIds: review.evaluation.duplicates.exactIds,
          similarIds: review.evaluation.duplicates.similarIds,
        },
        recommendation: review.evaluation.recommendation,
        recommendation_reasons: review.evaluation.reasons,
        recommendation_at: new Date().toISOString(),
        status: "under_review",
      })
      .eq("id", claimId)
      .eq("status", "submitted")
      .select("*")
      .single();
    if (error) throw error;
    return this.hydrate(data);
  }

  async markManualReview(claimId: string, reason: string) {
    const { data, error } = await this.adminClient
      .from("claims")
      .update({
        receipt_analysis: { failed: true, message: reason },
        recommendation: "review",
        recommendation_reasons: [reason],
        recommendation_at: new Date().toISOString(),
        status: "under_review",
      })
      .eq("id", claimId)
      .eq("status", "submitted")
      .select("*")
      .single();
    if (error) throw error;
    return this.hydrate(data);
  }

  async getClaim(claimId: string) {
    const { data, error } = await this.userClient
      .from("claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();
    if (error) throw error;
    return data ? this.hydrate(data) : null;
  }

  async getTreasuryLinkState(
    treasuryId: string,
  ): Promise<TreasuryLinkState> {
    const { data, error } = await this.userClient
      .from("treasuries")
      .select("sui_treasury_object_id")
      .eq("id", treasuryId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw new Error("The claim treasury is not accessible.");
    }
    return {
      linked: data.sui_treasury_object_id !== null,
      treasuryObjectId: data.sui_treasury_object_id,
    };
  }

  async decideClaim(
    claimId: string,
    decision: "approve" | "reject",
    reason: string,
  ) {
    const { data, error } = await this.userClient.rpc("decide_claim", {
      p_claim_id: claimId,
      p_decision: decision,
      p_reason: reason,
    });
    if (error) throw error;
    return this.hydrate(data);
  }

  async preparePaymentAttempt(claimId: string) {
    const { data, error } = await this.userClient.rpc("prepare_claim_payment", {
      p_claim_id: claimId,
    });
    if (error) throw error;
    const attempt = mapPaymentAttemptRow(data);
    return { attempt, snapshot: attempt.snapshot };
  }

  async getPaymentAttempt(attemptId: string) {
    const { data, error } = await this.userClient
      .from("claim_payment_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapPaymentAttemptRow(data) : null;
  }

  async loadPaymentPreflightState(attemptId: string) {
    const { data: attemptRow, error: attemptError } = await this.userClient
      .from("claim_payment_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();
    if (attemptError) throw attemptError;
    if (!attemptRow) return null;

    const [claimResult, treasuryResult, categoryResult] = await Promise.all([
      this.userClient
        .from("claims")
        .select("*")
        .eq("id", attemptRow.claim_id)
        .maybeSingle(),
      this.userClient
        .from("treasuries")
        .select("*")
        .eq("id", attemptRow.treasury_id)
        .maybeSingle(),
      this.userClient
        .from("budget_categories")
        .select("*")
        .eq("id", attemptRow.category_id)
        .maybeSingle(),
    ]);
    if (claimResult.error) throw claimResult.error;
    if (treasuryResult.error) throw treasuryResult.error;
    if (categoryResult.error) throw categoryResult.error;
    const claim = claimResult.data;
    const treasury = treasuryResult.data;
    const category = categoryResult.data;
    if (!claim || !treasury || !category) return null;
    if (!treasury.sui_treasury_object_id) {
      throw new Error("Payment treasury is not linked to Sui.");
    }

    const approvedSnapshot =
      claim.approved_treasury_object_id &&
      claim.approved_category_reference &&
      claim.approved_recipient_sui_address &&
      claim.approved_amount_minor !== null &&
      claim.approved_currency
        ? {
            treasuryObjectId: claim.approved_treasury_object_id,
            categoryReference: claim.approved_category_reference,
            recipientSuiAddress: claim.approved_recipient_sui_address,
            amountMinor: asMinorAmount(claim.approved_amount_minor),
            currency: claim.approved_currency,
          }
        : null;

    return {
      attempt: mapPaymentAttemptRow(attemptRow),
      claim: {
        id: claim.id,
        treasuryId: claim.treasury_id,
        categoryId: claim.category_id,
        status: claim.status,
        decision: claim.decision,
        paymentStatus: claim.payment_status,
        approvedSnapshot,
      },
      treasury: {
        id: treasury.id,
        suiTreasuryObjectId: treasury.sui_treasury_object_id,
        currency: treasury.currency,
        status: treasury.status,
      },
      category: {
        id: category.id,
        treasuryId: category.treasury_id,
        externalReference: category.external_reference,
        allocatedMinor: asMinorAmount(category.allocated_minor),
        spentMinor: asMinorAmount(category.spent_minor),
      },
    };
  }

  async getActivePaymentAttemptForClaim(claimId: string) {
    const { data, error } = await this.userClient
      .from("claim_payment_attempts")
      .select("*")
      .eq("claim_id", claimId)
      .in("status", [
        "prepared",
        "signed",
        "submitted",
        "reconciliation_required",
      ])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapPaymentAttemptRow(data) : null;
  }

  async markPaymentAttemptSigned(
    attemptId: string,
    digest: string,
    treasurerCapObjectId: string,
  ) {
    return this.transitionPaymentAttempt(attemptId, "signed", {
      digest,
      treasurerCapObjectId,
    });
  }

  async markPaymentAttemptSubmitted(attemptId: string) {
    return this.transitionPaymentAttempt(attemptId, "submitted");
  }

  async cancelPaymentAttempt(attemptId: string, code?: string) {
    return this.transitionPaymentAttempt(attemptId, "cancelled", { code });
  }

  async markPaymentAttemptReconciliationRequired(
    attemptId: string,
    code: string,
  ) {
    return this.transitionPaymentAttempt(attemptId, "reconciliation_required", {
      code,
    });
  }

  async markPaymentAttemptFailed(attemptId: string, code: string) {
    return this.transitionPaymentAttempt(attemptId, "failed", { code });
  }

  async finalizeConfirmedPayment(input: ConfirmedPaymentInput) {
    const { data, error } = await this.userClient.rpc(
      "finalize_claim_payment",
      {
        p_attempt_id: input.attemptId,
        p_transaction_digest: input.transactionDigest,
        p_confirmed_category_remaining_minor: input.categoryRemainingMinor,
      },
    );
    if (error) throw error;
    if (data.id !== input.claimId) {
      throw new Error("Finalized payment does not match the requested claim.");
    }
    return this.hydrate(data);
  }

  private async transitionPaymentAttempt(
    attemptId: string,
    status: ClaimPaymentAttemptRow["status"],
    evidence: {
      digest?: string;
      treasurerCapObjectId?: string;
      code?: string;
    } = {},
  ) {
    const { data, error } = await this.userClient.rpc(
      "transition_claim_payment_attempt",
      {
        p_attempt_id: attemptId,
        p_status: status,
        p_transaction_digest: evidence.digest ?? null,
        p_treasurer_cap_object_id: evidence.treasurerCapObjectId ?? null,
        p_failure_code: evidence.code ?? null,
      },
    );
    if (error) throw error;
    return mapPaymentAttemptRow(data);
  }

  private async hydrate(row: ClaimRow): Promise<PersistedClaim> {
    const { data: category, error } = await this.userClient
      .from("budget_categories")
      .select("name,external_reference")
      .eq("id", row.category_id)
      .single();
    if (error) throw error;
    return mapClaimRow(
      row,
      category as Pick<BudgetCategoryRow, "name" | "external_reference">,
    );
  }
}

function mapPaymentAttemptRow(row: ClaimPaymentAttemptRow): PaymentAttempt {
  return {
    id: row.id,
    claimId: row.claim_id,
    initiatedByUserId: row.initiated_by,
    snapshot: {
      treasuryObjectId: row.expected_treasury_object_id,
      categoryReference: row.expected_category_reference,
      recipientSuiAddress: row.expected_recipient_sui_address,
      amountMinor: asMinorAmount(row.expected_amount_minor),
      currency: row.expected_currency,
    },
    treasurerCapObjectId: row.treasurer_cap_object_id,
    transactionDigest: row.transaction_digest,
    status: row.status,
    failureCode: row.failure_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
  };
}

export async function createSupabaseClaimRepository() {
  const userClient = await createServerSupabaseClient();
  const userId = await requireSupabaseUserId(userClient);
  const { data: profile, error } = await userClient
    .from("wallet_profiles")
    .select("wallet_address")
    .eq("user_id", userId)
    .single();
  if (error || !profile) {
    throw new Error("Verify the connected Sui wallet before continuing.");
  }
  return new SupabaseClaimRepository(
    { userId, walletAddress: profile.wallet_address },
    userClient,
    createAdminSupabaseClient(),
  );
}
