import { randomUUID } from "node:crypto";
import type { DuplicateClaimCandidate } from "@/src/domain/claim-rules";
import type { ReceiptMimeType } from "@/src/domain/receipt-evidence";
import {
  demoSuiAddress,
  type PersistedClaim,
  type PersistedClaimSubmission,
} from "@/src/domain/stage5-claims";
import type {
  ClaimRepository,
  FinalClaimReview,
  PersistedWorkspace,
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
  };
  return root[storeSymbol];
}

export class MockClaimRepository implements ClaimRepository {
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
}
