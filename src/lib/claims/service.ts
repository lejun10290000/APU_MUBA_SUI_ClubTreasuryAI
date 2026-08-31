import { evaluateClaimRules } from "@/src/domain/claim-rules";
import {
  buildReceiptStoragePath,
  hashReceiptBytes,
  validateReceiptBytes,
  validateReceiptFile,
} from "@/src/domain/receipt-evidence";
import type { PersistedClaimSubmission } from "@/src/domain/stage5-claims";
import { claimSchema } from "@/src/domain/schemas";
import type { AIService, ReceiptAnalysis } from "@/src/lib/ai/types";
import type { ClaimRepository } from "./types";

export async function submitClaimWorkflow({
  repository,
  aiService,
  submission,
  receipt,
}: {
  repository: ClaimRepository;
  aiService: AIService;
  submission: PersistedClaimSubmission;
  receipt: File;
}) {
  validateReceiptFile(receipt);
  const existing = await repository.findByExternalReference(
    submission.externalReference,
  );
  if (existing) {
    return { claim: existing, idempotentReplay: true };
  }

  const bytes = new Uint8Array(await receipt.arrayBuffer());
  validateReceiptBytes(bytes, receipt.type);
  const receiptHash = hashReceiptBytes(bytes);
  const workspace = await repository.ensureWorkspace(submission);
  const receiptPath = buildReceiptStoragePath({
    userId: repository.identity.userId,
    claimReference: submission.externalReference,
    mimeType: receipt.type,
  });
  let uploaded = false;
  let createdClaimId: string | null = null;

  try {
    try {
      await repository.uploadReceipt(receiptPath, bytes, receipt.type);
    } catch (error) {
      const replay = await repository.findByExternalReference(
        submission.externalReference,
      );
      if (replay) {
        return { claim: replay, idempotentReplay: true };
      }
      throw error;
    }
    uploaded = true;
    const submitted = await repository.createSubmittedClaim({
      submission,
      workspace,
      identity: repository.identity,
      receiptPath,
      receiptHash,
      receiptMimeType: receipt.type,
      receiptSizeBytes: bytes.byteLength,
    });
    createdClaimId = submitted.id;

    let analysis: ReceiptAnalysis | { failed: true; message: string };
    let aiNeedsReview = false;
    let receiptAmountMinor = submission.receiptAmountMinor;
    try {
      const result = await aiService.analyzeReceipt({
        receiptId: submitted.id,
        requestedAmountMinor: submission.requestedAmountMinor,
        image: {
          mimeType: receipt.type,
          base64: Buffer.from(bytes).toString("base64"),
        },
      });
      analysis = result;
      receiptAmountMinor = result.amountMinor ?? receiptAmountMinor;
      const categorySuggestion = normalizeCategory(result.categorySuggestion);
      const categoryMatches = [
        workspace.categoryName,
        workspace.categoryExternalReference,
      ]
        .map(normalizeCategory)
        .includes(categorySuggestion);
      aiNeedsReview =
        result.needsReview ||
        result.missingFields.length > 0 ||
        !categorySuggestion ||
        !categoryMatches;
    } catch (error) {
      aiNeedsReview = true;
      analysis = {
        failed: true,
        message:
          error instanceof Error
            ? error.message
            : "Receipt analysis did not complete.",
      };
    }

    const candidates = await repository.findDuplicateCandidates(
      workspace.treasuryId,
      submitted.id,
    );
    const evaluation = evaluateClaimRules({
      claim: claimSchema.parse({
        id: submitted.id,
        treasuryId: workspace.treasuryId,
        categoryId: workspace.categoryId,
        submitterName: submission.submitterName,
        description: submission.description,
        requestedAmountMinor: submission.requestedAmountMinor,
        receiptAmountMinor,
        currency: "USDC",
        status: "under_review",
        recommendation: null,
      }),
      merchant: submission.merchant,
      receiptReference: submission.receiptReference,
      receiptHash,
      existingClaims: candidates,
      categoryAllocatedMinor: workspace.categoryAllocatedMinor,
      categorySpentMinor: workspace.categorySpentMinor,
      aiNeedsReview,
    });

    const claim = await repository.finalizeReview(submitted.id, {
      receiptAmountMinor,
      receiptAnalysis: analysis,
      evaluation,
    });
    return { claim, idempotentReplay: false };
  } catch (error) {
    if (createdClaimId) {
      try {
        const claim = await repository.markManualReview(
          createdClaimId,
          "The workflow was interrupted after persistence. A treasurer must review this claim manually.",
        );
        return { claim, idempotentReplay: false };
      } catch {
        throw error;
      }
    }
    if (uploaded) {
      await repository.deleteReceipt(receiptPath).catch(() => undefined);
    }
    throw error;
  }
}

function normalizeCategory(value: string | null): string {
  return value?.trim().toLocaleLowerCase("en").replace(/\s+/g, " ") ?? "";
}
