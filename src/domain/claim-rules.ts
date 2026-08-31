import { hasSufficientCategoryRemaining } from "./budget-rules";
import { asMinorAmount, type MinorAmount } from "./money";
import type { Claim, ClaimRecommendation } from "./schemas";

export type ReceiptAmountStatus =
  | "missing"
  | "match"
  | "receipt_lower"
  | "receipt_higher";

export interface ReceiptAmountCheck {
  status: ReceiptAmountStatus;
  matches: boolean;
  differenceMinor: MinorAmount;
}

export interface DuplicateClaimCandidate {
  id: string;
  merchant: string;
  receiptReference: string | null;
  receiptHash?: string | null;
  requestedAmountMinor: MinorAmount;
}

export interface DuplicateClaimCheck {
  exactIds: string[];
  similarIds: string[];
  hasExact: boolean;
  hasSimilar: boolean;
}

export interface ClaimRuleEvaluation {
  recommendation: ClaimRecommendation;
  receipt: ReceiptAmountCheck;
  duplicates: DuplicateClaimCheck;
  hasSufficientBudget: boolean;
  reasons: string[];
}

export function compareReceiptAmount(
  requestedAmountMinor: MinorAmount,
  receiptAmountMinor: MinorAmount | null,
): ReceiptAmountCheck {
  if (receiptAmountMinor === null) {
    return {
      status: "missing",
      matches: false,
      differenceMinor: asMinorAmount(0),
    };
  }

  const differenceMinor = asMinorAmount(
    Math.abs(requestedAmountMinor - receiptAmountMinor),
  );

  if (differenceMinor === 0) {
    return { status: "match", matches: true, differenceMinor };
  }

  return {
    status:
      receiptAmountMinor < requestedAmountMinor
        ? "receipt_lower"
        : "receipt_higher",
    matches: false,
    differenceMinor,
  };
}

export function findPotentialDuplicateClaims(
  candidate: DuplicateClaimCandidate,
  existingClaims: readonly DuplicateClaimCandidate[],
): DuplicateClaimCheck {
  const candidateReference = normalize(candidate.receiptReference ?? "");
  const candidateHash = normalizeHash(candidate.receiptHash);
  const candidateMerchant = normalize(candidate.merchant);
  const exactIds: string[] = [];
  const similarIds: string[] = [];

  for (const existing of existingClaims) {
    if (existing.id === candidate.id) {
      continue;
    }

    const existingReference = normalize(existing.receiptReference ?? "");
    const existingHash = normalizeHash(existing.receiptHash);
    const isExact =
      (candidateHash.length > 0 && candidateHash === existingHash) ||
      (candidateReference.length > 0 &&
        candidateReference === existingReference);

    if (isExact) {
      exactIds.push(existing.id);
      continue;
    }

    const isSimilar =
      candidateMerchant.length > 0 &&
      candidateMerchant === normalize(existing.merchant) &&
      candidate.requestedAmountMinor === existing.requestedAmountMinor;

    if (isSimilar) {
      similarIds.push(existing.id);
    }
  }

  return {
    exactIds,
    similarIds,
    hasExact: exactIds.length > 0,
    hasSimilar: similarIds.length > 0,
  };
}

export function evaluateClaimRules({
  claim,
  merchant,
  receiptReference,
  receiptHash,
  existingClaims,
  categoryAllocatedMinor,
  categorySpentMinor,
  aiNeedsReview = false,
}: {
  claim: Claim;
  merchant: string;
  receiptReference: string | null;
  receiptHash?: string | null;
  existingClaims: readonly DuplicateClaimCandidate[];
  categoryAllocatedMinor: MinorAmount;
  categorySpentMinor: MinorAmount;
  aiNeedsReview?: boolean;
}): ClaimRuleEvaluation {
  const receipt = compareReceiptAmount(
    claim.requestedAmountMinor,
    claim.receiptAmountMinor,
  );
  const duplicates = findPotentialDuplicateClaims(
    {
      id: claim.id,
      merchant,
      receiptReference,
      receiptHash,
      requestedAmountMinor: claim.requestedAmountMinor,
    },
    existingClaims,
  );
  const hasSufficientBudget = hasSufficientCategoryRemaining(
    categoryAllocatedMinor,
    categorySpentMinor,
    claim.requestedAmountMinor,
  );
  const reasons: string[] = [];

  if (receipt.status === "match") {
    reasons.push("Receipt and requested amounts match exactly.");
  } else if (receipt.status === "missing") {
    reasons.push("Receipt amount is missing and needs human review.");
  } else {
    reasons.push("Receipt and requested amounts do not match.");
  }

  if (duplicates.hasExact) {
    reasons.push(
      "The receipt bytes or reference exactly match an existing claim.",
    );
  } else if (duplicates.hasSimilar) {
    reasons.push("The merchant and requested amount match an existing claim.");
  } else {
    reasons.push("No deterministic duplicate signal was found.");
  }

  reasons.push(
    hasSufficientBudget
      ? "The selected category has enough remaining budget."
      : "The request exceeds the selected category's remaining budget.",
  );

  if (aiNeedsReview) {
    reasons.push(
      "AI analysis found missing, ambiguous, or category-conflicting evidence that needs human review.",
    );
  }

  let recommendation: ClaimRecommendation = "approve";
  if (duplicates.hasExact || !hasSufficientBudget) {
    recommendation = "reject";
  } else if (!receipt.matches || duplicates.hasSimilar || aiNeedsReview) {
    recommendation = "review";
  }

  return {
    recommendation,
    receipt,
    duplicates,
    hasSufficientBudget,
    reasons,
  };
}

function normalizeHash(value: string | null | undefined): string {
  const normalized = value?.trim().toLocaleLowerCase("en") ?? "";
  return /^[0-9a-f]{64}$/.test(normalized) ? normalized : "";
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}
