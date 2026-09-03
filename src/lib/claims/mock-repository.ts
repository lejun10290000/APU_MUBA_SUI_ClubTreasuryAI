import { randomUUID } from "node:crypto";
import type { DuplicateClaimCandidate } from "@/src/domain/claim-rules";
import type { ReceiptMimeType } from "@/src/domain/receipt-evidence";
import { asMinorAmount } from "@/src/domain/money";
import {
  demoSuiAddress,
  type PersistedClaim,
  type PersistedClaimSubmission,
} from "@/src/domain/stage5-claims";
import {
  isActivePaymentAttemptStatus,
  parseApprovedPayoutSnapshot,
  type ConfirmedPaymentInput,
  type PaymentAttempt,
} from "@/src/domain/stage6-payments";
import type {
  FinalClaimReview,
  PersistedWorkspace,
  Stage6ClaimRepository,
  SubmittedClaimInsert,
} from "./types";

interface MockWorkspace extends PersistedWorkspace {
  ownerUserId: string;
  externalReference: string;
}

interface MockClaimStore {
  workspaces: MockWorkspace[];
  claims: Map<string, PersistedClaim>;
  receipts: Map<string, Uint8Array>;
  paymentAttempts: Map<string, PaymentAttempt>;
}

const mockUserId = "00000000-0000-4000-8000-000000000001";
const storeSymbol = Symbol.for("clubtreasury.stage5.mock-store");

function globalStore(): MockClaimStore {
  const root = globalThis as typeof globalThis & {
    [storeSymbol]?: MockClaimStore;
  };
  root[storeSymbol] ??= {
    workspaces: [],
    claims: new Map(),
    receipts: new Map(),
    paymentAttempts: new Map(),
  };
  return root[storeSymbol];
}

export class MockClaimRepository implements Stage6ClaimRepository {
  readonly identity = { userId: mockUserId, walletAddress: demoSuiAddress };

  constructor(private readonly store = globalStore()) {}

  async findByExternalReference(reference: string) {
    return (
      [...this.store.claims.values()].find(
        (claim) => claim.externalReference === reference,
      ) ?? null
    );
  }

  async ensureWorkspace(
    submission: PersistedClaimSubmission,
  ): Promise<PersistedWorkspace> {
    const selectedCategory = submission.workspace.categories.find(
      (category) =>
        category.externalReference === submission.categoryExternalReference,
    );
    if (!selectedCategory) {
      throw new Error("Choose a category from the active treasury budget.");
    }
    let workspace = this.store.workspaces.find(
      (candidate) =>
        candidate.ownerUserId === this.identity.userId &&
        candidate.externalReference ===
          submission.workspace.externalReference &&
        candidate.categoryExternalReference ===
          selectedCategory.externalReference,
    );
    workspace ??= {
      ownerUserId: this.identity.userId,
      externalReference: submission.workspace.externalReference,
      treasuryId: randomUUID(),
      categoryId: randomUUID(),
      categoryName: selectedCategory.name,
      categoryExternalReference: selectedCategory.externalReference,
      categoryAllocatedMinor: selectedCategory.allocatedMinor,
      categorySpentMinor: selectedCategory.spentMinor,
      treasuryObjectId: submission.workspace.treasuryObjectId,
    };
    if (!this.store.workspaces.includes(workspace)) {
      this.store.workspaces.push(workspace);
    }
    return structuredClone(workspace);
  }

  async uploadReceipt(
    path: string,
    bytes: Uint8Array,
    mimeType: ReceiptMimeType,
  ) {
    void mimeType;
    if (this.store.receipts.has(path)) {
      throw new Error("Receipt path already exists.");
    }
    this.store.receipts.set(path, Uint8Array.from(bytes));
  }

  async deleteReceipt(path: string) {
    this.store.receipts.delete(path);
  }

  async createSubmittedClaim(input: SubmittedClaimInsert) {
    const now = new Date().toISOString();
    const claim: PersistedClaim = {
      id: randomUUID(),
      externalReference: input.submission.externalReference,
      treasuryId: input.workspace.treasuryId,
      categoryId: input.workspace.categoryId,
      categoryName: input.workspace.categoryName,
      categoryExternalReference: input.workspace.categoryExternalReference,
      treasuryObjectId: input.workspace.treasuryObjectId,
      memberWalletAddress: input.identity.walletAddress,
      recipientSuiAddress: input.submission.recipientSuiAddress,
      submitterName: input.submission.submitterName,
      merchant: input.submission.merchant,
      description: input.submission.description,
      requestedAmountMinor: input.submission.requestedAmountMinor,
      receiptAmountMinor: input.submission.receiptAmountMinor,
      receiptReference: input.submission.receiptReference,
      receiptHash: input.receiptHash,
      receiptMimeType: input.receiptMimeType,
      receiptSizeBytes: input.receiptSizeBytes,
      receiptAnalysis: null,
      duplicateMatch: { exactIds: [], similarIds: [] },
      recommendation: null,
      recommendationReasons: [],
      status: "submitted",
      decision: null,
      decisionReason: null,
      paymentStatus: "unpaid",
      approvedSnapshot: null,
      createdAt: now,
      decidedAt: null,
      confirmedTransactionDigest: null,
      paidAt: null,
    };
    this.store.claims.set(claim.id, claim);
    return structuredClone(claim);
  }

  async findDuplicateCandidates(
    treasuryId: string,
    excludedClaimId: string,
  ): Promise<DuplicateClaimCandidate[]> {
    return [...this.store.claims.values()]
      .filter(
        (claim) =>
          claim.treasuryId === treasuryId && claim.id !== excludedClaimId,
      )
      .map((claim) => ({
        id: claim.id,
        merchant: claim.merchant,
        receiptReference: claim.receiptReference,
        receiptHash: claim.receiptHash,
        requestedAmountMinor: claim.requestedAmountMinor,
      }));
  }

  async finalizeReview(claimId: string, review: FinalClaimReview) {
    const claim = this.requireClaim(claimId);
    const updated: PersistedClaim = {
      ...claim,
      receiptAmountMinor: review.receiptAmountMinor,
      receiptAnalysis: review.receiptAnalysis,
      duplicateMatch: {
        exactIds: review.evaluation.duplicates.exactIds,
        similarIds: review.evaluation.duplicates.similarIds,
      },
      recommendation: review.evaluation.recommendation,
      recommendationReasons: review.evaluation.reasons,
      status: "under_review",
    };
    this.store.claims.set(claimId, updated);
    return structuredClone(updated);
  }

  async markManualReview(claimId: string, reason: string) {
    const claim = this.requireClaim(claimId);
    const updated: PersistedClaim = {
      ...claim,
      receiptAnalysis: { failed: true, message: reason },
      recommendation: "review",
      recommendationReasons: [reason],
      status: "under_review",
    };
    this.store.claims.set(claimId, updated);
    return structuredClone(updated);
  }

  async getClaim(claimId: string) {
    const claim = this.store.claims.get(claimId);
    return claim ? structuredClone(claim) : null;
  }

  async decideClaim(
    claimId: string,
    decision: "approve" | "reject",
    reason: string,
  ) {
    const claim = this.requireClaim(claimId);
    if (claim.status !== "under_review") {
      throw new Error("Only an under-review claim can be decided.");
    }
    const decidedAt = new Date().toISOString();
    const updated: PersistedClaim = {
      ...claim,
      decision,
      decisionReason: reason,
      decidedAt,
      status: decision === "approve" ? "approved_unpaid" : "rejected",
      approvedSnapshot:
        decision === "approve"
          ? {
              treasuryObjectId: claim.treasuryObjectId,
              categoryReference: claim.categoryExternalReference,
              recipientSuiAddress: claim.recipientSuiAddress,
              amountMinor: claim.requestedAmountMinor,
              currency: "USDC",
            }
          : null,
    };
    this.store.claims.set(claimId, updated);
    return structuredClone(updated);
  }

  async preparePaymentAttempt(claimId: string) {
    const claim = this.requireClaim(claimId);
    const snapshot = parseApprovedPayoutSnapshot(claim);
    const existing = [...this.store.paymentAttempts.values()].find(
      (attempt) =>
        attempt.claimId === claimId &&
        isActivePaymentAttemptStatus(attempt.status),
    );
    if (existing) {
      return { attempt: structuredClone(existing), snapshot };
    }

    const now = new Date().toISOString();
    const attempt: PaymentAttempt = {
      id: randomUUID(),
      claimId,
      initiatedByUserId: this.identity.userId,
      snapshot,
      treasurerCapObjectId: null,
      transactionDigest: null,
      status: "prepared",
      failureCode: null,
      createdAt: now,
      updatedAt: now,
      confirmedAt: null,
    };
    this.store.paymentAttempts.set(attempt.id, attempt);
    return { attempt: structuredClone(attempt), snapshot };
  }

  async getPaymentAttempt(attemptId: string) {
    const attempt = this.store.paymentAttempts.get(attemptId);
    return attempt ? structuredClone(attempt) : null;
  }

  async loadPaymentPreflightState(attemptId: string) {
    const attempt = this.store.paymentAttempts.get(attemptId);
    if (!attempt) return null;
    const claim = this.store.claims.get(attempt.claimId);
    const workspace = claim
      ? this.store.workspaces.find(
          (candidate) =>
            candidate.treasuryId === claim.treasuryId &&
            candidate.categoryId === claim.categoryId,
        )
      : null;
    if (!claim || !workspace) return null;
    return {
      attempt: structuredClone(attempt),
      claim: {
        id: claim.id,
        treasuryId: claim.treasuryId,
        categoryId: claim.categoryId,
        status: claim.status,
        decision: claim.decision,
        paymentStatus: claim.paymentStatus,
        approvedSnapshot: claim.approvedSnapshot,
      },
      treasury: {
        id: workspace.treasuryId,
        suiTreasuryObjectId: workspace.treasuryObjectId,
        currency: "USDC",
        status: "active",
      },
      category: {
        id: workspace.categoryId,
        treasuryId: workspace.treasuryId,
        externalReference: workspace.categoryExternalReference,
        allocatedMinor: workspace.categoryAllocatedMinor,
        spentMinor: workspace.categorySpentMinor,
      },
    };
  }

  async getActivePaymentAttemptForClaim(claimId: string) {
    const attempt = [...this.store.paymentAttempts.values()]
      .filter(
        (candidate) =>
          candidate.claimId === claimId &&
          isActivePaymentAttemptStatus(candidate.status),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
    return attempt ? structuredClone(attempt) : null;
  }

  async markPaymentAttemptSigned(
    attemptId: string,
    digest: string,
    treasurerCapObjectId: string,
  ) {
    const attempt = this.requireAttempt(attemptId);
    if (attempt.status !== "prepared") {
      throw new Error("Only prepared attempts can become signed.");
    }
    if (!digest.trim() || !treasurerCapObjectId.trim()) {
      throw new Error("Signed attempt requires digest and TreasurerCap.");
    }
    return this.updateAttempt(attempt, {
      status: "signed",
      transactionDigest: digest.trim(),
      treasurerCapObjectId,
      failureCode: null,
    });
  }

  async markPaymentAttemptSubmitted(attemptId: string) {
    const attempt = this.requireAttempt(attemptId);
    if (attempt.status !== "signed" || !attempt.transactionDigest) {
      throw new Error(
        "Only signed attempts with a digest can become submitted.",
      );
    }
    return this.updateAttempt(attempt, {
      status: "submitted",
      failureCode: null,
    });
  }

  async cancelPaymentAttempt(attemptId: string, code?: string) {
    const attempt = this.requireAttempt(attemptId);
    if (attempt.status !== "prepared") {
      throw new Error("Only prepared attempts can be cancelled.");
    }
    return this.updateAttempt(attempt, {
      status: "cancelled",
      failureCode: code?.trim() || null,
    });
  }

  async markPaymentAttemptReconciliationRequired(
    attemptId: string,
    code: string,
  ) {
    const attempt = this.requireAttempt(attemptId);
    if (
      !["signed", "submitted", "reconciliation_required"].includes(
        attempt.status,
      ) ||
      !attempt.transactionDigest
    ) {
      throw new Error("Reconciliation requires an existing digest.");
    }
    return this.updateAttempt(attempt, {
      status: "reconciliation_required",
      failureCode: code.trim() || null,
    });
  }

  async markPaymentAttemptFailed(attemptId: string, code: string) {
    const attempt = this.requireAttempt(attemptId);
    if (!["prepared", "signed", "submitted"].includes(attempt.status)) {
      throw new Error(
        "Attempt cannot transition to failed from its current state.",
      );
    }
    return this.updateAttempt(attempt, {
      status: "failed",
      failureCode: code.trim() || null,
    });
  }

  async finalizeConfirmedPayment(input: ConfirmedPaymentInput) {
    const attempt = this.requireAttempt(input.attemptId);
    const claim = this.requireClaim(input.claimId);
    if (attempt.claimId !== claim.id) {
      throw new Error("Payment attempt does not match claim.");
    }
    if (
      !attempt.transactionDigest ||
      attempt.transactionDigest !== input.transactionDigest.trim()
    ) {
      throw new Error("Confirmed digest does not match payment attempt.");
    }
    if (
      attempt.status === "confirmed" &&
      claim.status === "paid" &&
      claim.paymentStatus === "paid" &&
      claim.confirmedTransactionDigest === attempt.transactionDigest
    ) {
      return structuredClone(claim);
    }
    if (!["submitted", "reconciliation_required"].includes(attempt.status)) {
      throw new Error("Payment attempt is not ready for confirmation.");
    }
    const snapshot = parseApprovedPayoutSnapshot(claim);
    if (JSON.stringify(snapshot) !== JSON.stringify(attempt.snapshot)) {
      throw new Error("Approved payout snapshot mismatch.");
    }
    const workspace = this.store.workspaces.find(
      (candidate) =>
        candidate.treasuryId === claim.treasuryId &&
        candidate.categoryId === claim.categoryId,
    );
    if (!workspace) throw new Error("Budget category not found.");
    const expectedRemaining =
      workspace.categoryAllocatedMinor -
      workspace.categorySpentMinor -
      attempt.snapshot.amountMinor;
    if (expectedRemaining < 0) {
      throw new Error("Payment exceeds remaining category budget.");
    }
    if (input.categoryRemainingMinor !== expectedRemaining) {
      throw new Error(
        "Confirmed category remaining does not match database budget state.",
      );
    }
    workspace.categorySpentMinor = asMinorAmount(
      workspace.categoryAllocatedMinor - input.categoryRemainingMinor,
    );
    this.updateAttempt(attempt, {
      status: "confirmed",
      failureCode: null,
      confirmedAt: input.confirmedAt,
    });
    const updated: PersistedClaim = {
      ...claim,
      status: "paid",
      paymentStatus: "paid",
      confirmedTransactionDigest: attempt.transactionDigest,
      paidAt: input.confirmedAt,
    };
    this.store.claims.set(claim.id, updated);
    return structuredClone(updated);
  }

  private requireAttempt(attemptId: string) {
    const attempt = this.store.paymentAttempts.get(attemptId);
    if (!attempt) throw new Error("Payment attempt not found.");
    return attempt;
  }

  private updateAttempt(
    attempt: PaymentAttempt,
    update: Partial<PaymentAttempt>,
  ) {
    const updated: PaymentAttempt = {
      ...attempt,
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.store.paymentAttempts.set(attempt.id, updated);
    return structuredClone(updated);
  }

  private requireClaim(claimId: string) {
    const claim = this.store.claims.get(claimId);
    if (!claim) {
      throw new Error("Claim not found.");
    }
    return claim;
  }
}

export function resetMockClaimStore() {
  const store = globalStore();
  store.workspaces.length = 0;
  store.claims.clear();
  store.receipts.clear();
  store.paymentAttempts.clear();
}
