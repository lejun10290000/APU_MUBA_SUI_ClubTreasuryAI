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

    const { data: existingTreasury, error: lookupError } = await this.userClient
      .from("treasuries")
      .select("*")
      .eq("sui_treasury_object_id", submission.workspace.treasuryObjectId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (
      existingTreasury &&
      existingTreasury.external_reference !==
        submission.workspace.externalReference
    ) {
      throw new Error(
        "The selected Sui treasury does not match this workspace reference.",
      );
    }

    let treasury = existingTreasury;
    if (!treasury) {
      // Keep INSERT and SELECT as separate statements. PostgreSQL applies the
      // SELECT policy to INSERT ... RETURNING before can_access_treasury() can
      // observe the new row, which rejects a valid first-time owner insert.
      const { error: insertError } = await this.userClient
        .from("treasuries")
        .insert({
          owner_user_id: this.identity.userId,
          external_reference: submission.workspace.externalReference,
          name: submission.workspace.name,
          total_budget_minor: submission.workspace.totalBudgetMinor,
          sui_treasury_object_id: submission.workspace.treasuryObjectId,
          currency: "USDC",
          status: "active",
        });
      if (insertError && insertError.code !== "23505") throw insertError;

      const { data, error: createdLookupError } = await this.userClient
        .from("treasuries")
        .select("*")
        .eq("sui_treasury_object_id", submission.workspace.treasuryObjectId)
        .single();
      if (createdLookupError) throw createdLookupError;
      treasury = data;

      if (
        treasury.external_reference !== submission.workspace.externalReference
      ) {
        throw new Error(
          "The selected Sui treasury does not match this workspace reference.",
        );
      }
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
    if (!membership) {
      const { error } = await this.userClient.from("treasury_members").insert({
        treasury_id: treasury.id,
        user_id: this.identity.userId,
        role: "owner",
      });
      if (error) throw error;
    }

    const canManage =
      treasury.owner_user_id === this.identity.userId ||
      membership?.role === "owner" ||
      membership?.role === "treasurer";

    if (canManage) {
      for (const category of submission.workspace.categories) {
        const { data: existing, error: existingError } = await this.userClient
          .from("budget_categories")
          .select("id")
          .eq("treasury_id", treasury.id)
          .eq("external_reference", category.externalReference)
          .maybeSingle();
        if (existingError) throw existingError;
        if (existing) {
          const { error } = await this.userClient
            .from("budget_categories")
            .update({
              name: category.name,
              allocated_minor: category.allocatedMinor,
              spent_minor: category.spentMinor,
            })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await this.userClient
            .from("budget_categories")
            .insert({
              treasury_id: treasury.id,
              external_reference: category.externalReference,
              name: category.name,
              allocated_minor: category.allocatedMinor,
              spent_minor: category.spentMinor,
            });
          if (error) throw error;
        }
      }
    }

    const { data: category, error: categoryError } = await this.userClient
      .from("budget_categories")
      .select("*")
      .eq("treasury_id", treasury.id)
      .eq("external_reference", selected.externalReference)
      .single();
    if (categoryError) throw categoryError;

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
        recipient_sui_address: input.submission.recipientSuiAddress,
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
    const { data, error } = await this.userClient.rpc("finalize_claim_payment", {
      p_attempt_id: input.attemptId,
      p_transaction_digest: input.transactionDigest,
      p_confirmed_category_remaining_minor: input.categoryRemainingMinor,
    });
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
