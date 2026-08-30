import type {
  ClaimRuleEvaluation,
  DuplicateClaimCandidate,
} from "@/src/domain/claim-rules";
import type { ReceiptMimeType } from "@/src/domain/receipt-evidence";
import type {
  ClaimDecisionInput,
  PersistedClaim,
  PersistedClaimSubmission,
} from "@/src/domain/stage5-claims";
import type { ReceiptAnalysis } from "@/src/lib/ai/types";
import type { MinorAmount } from "@/src/domain/money";

export interface ClaimIdentity {
  userId: string;
  walletAddress: string;
}

export interface PersistedWorkspace {
  treasuryId: string;
  categoryId: string;
  categoryName: string;
  categoryExternalReference: string;
  categoryAllocatedMinor: MinorAmount;
  categorySpentMinor: MinorAmount;
  treasuryObjectId: string;
}

export interface SubmittedClaimInsert {
  submission: PersistedClaimSubmission;
  workspace: PersistedWorkspace;
  identity: ClaimIdentity;
  receiptPath: string;
  receiptHash: string;
  receiptMimeType: ReceiptMimeType;
  receiptSizeBytes: number;
}

export interface FinalClaimReview {
  receiptAmountMinor: MinorAmount | null;
  receiptAnalysis: ReceiptAnalysis | { failed: true; message: string };
  evaluation: ClaimRuleEvaluation;
}

export interface ClaimRepository {
  readonly identity: ClaimIdentity;
  findByExternalReference(reference: string): Promise<PersistedClaim | null>;
  ensureWorkspace(
    submission: PersistedClaimSubmission,
  ): Promise<PersistedWorkspace>;
  uploadReceipt(
    path: string,
    bytes: Uint8Array,
    mimeType: ReceiptMimeType,
  ): Promise<void>;
  deleteReceipt(path: string): Promise<void>;
  createSubmittedClaim(input: SubmittedClaimInsert): Promise<PersistedClaim>;
  findDuplicateCandidates(
    treasuryId: string,
    excludedClaimId: string,
  ): Promise<DuplicateClaimCandidate[]>;
  finalizeReview(
    claimId: string,
    review: FinalClaimReview,
  ): Promise<PersistedClaim>;
  markManualReview(claimId: string, reason: string): Promise<PersistedClaim>;
  getClaim(claimId: string): Promise<PersistedClaim | null>;
  decideClaim(
    claimId: string,
    decision: ClaimDecisionInput["decision"],
    reason: ClaimDecisionInput["reason"],
  ): Promise<PersistedClaim>;
}
