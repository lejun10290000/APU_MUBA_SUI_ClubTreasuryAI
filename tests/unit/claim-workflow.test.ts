import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  demoSuiAddress,
  persistedClaimSubmissionSchema,
  type PersistedClaimSubmission,
} from "@/src/domain/stage5-claims";
import type {
  AIService,
  BudgetDraft,
  ReceiptAnalysis,
  ReceiptAnalysisInput,
} from "@/src/lib/ai/types";
import { receiptAnalysisSchema } from "@/src/lib/ai/types";
import {
  MockClaimRepository,
  resetMockClaimStore,
} from "@/src/lib/claims/mock-repository";
import { submitClaimWorkflow } from "@/src/lib/claims/service";

describe("Stage 5 claim workflow", () => {
  beforeEach(() => resetMockClaimStore());

  it("persists one analysed claim and replays the same idempotency reference", async () => {
    const repository = new MockClaimRepository();
    const submission = makeSubmission();
    const first = await submit(repository, submission, validAnalysis(), "one");
    const replay = await submit(repository, submission, validAnalysis(), "one");

    expect(first.idempotentReplay).toBe(false);
    expect(replay.idempotentReplay).toBe(true);
    expect(replay.claim.id).toBe(first.claim.id);
    expect(first.claim.receiptHash).toMatch(/^[0-9a-f]{64}$/);
    expect(first.claim.receiptAnalysis).toMatchObject({
      merchant: "Campus Print Shop",
    });
    expect(first.claim.recommendation).toBe("approve");
  });

  it("rejects an exact duplicate receipt hash even with a different reference", async () => {
    const repository = new MockClaimRepository();
    await submit(repository, makeSubmission(), validAnalysis(), "same bytes");
    const duplicate = await submit(
      repository,
      makeSubmission({
        externalReference: randomUUID(),
        receiptReference: "DIFFERENT-REF",
        merchant: "Different merchant",
      }),
      validAnalysis({ merchant: "Different merchant" }),
      "same bytes",
    );
    expect(duplicate.claim.duplicateMatch.exactIds).toHaveLength(1);
    expect(duplicate.claim.recommendation).toBe("reject");
  });

  it("sends similar duplicates, amount mismatches, and missing evidence to Review", async () => {
    const repository = new MockClaimRepository();
    await submit(repository, makeSubmission(), validAnalysis(), "first bytes");

    const similar = await submit(
      repository,
      makeSubmission({
        externalReference: randomUUID(),
        receiptReference: "NEW",
      }),
      validAnalysis(),
      "different bytes",
    );
    expect(similar.claim.duplicateMatch.similarIds).toHaveLength(1);
    expect(similar.claim.recommendation).toBe("review");

    const mismatchRepository = freshRepository();
    const mismatch = await submit(
      mismatchRepository,
      makeSubmission(),
      validAnalysis({ amountMinor: 7_000 }),
      "mismatch",
    );
    expect(mismatch.claim.recommendation).toBe("review");

    const missingRepository = freshRepository();
    const missing = await submit(
      missingRepository,
      makeSubmission({ receiptAmountMinor: null }),
      validAnalysis({
        amountMinor: null,
        needsReview: true,
        missingFields: ["amount"],
      }),
      "missing",
    );
    expect(missing.claim.recommendation).toBe("review");
  });

  it("rejects a claim that exceeds the persisted category balance", async () => {
    const result = await submit(
      new MockClaimRepository(),
      makeSubmission({
        requestedAmountMinor: 11_000,
        receiptAmountMinor: 11_000,
      }),
      validAnalysis({ amountMinor: 11_000 }),
      "over budget",
    );
    expect(result.claim.recommendation).toBe("reject");
    expect(result.claim.recommendationReasons.join(" ")).toMatch(/exceeds/);
  });

  it("falls back to manual Review when AI fails", async () => {
    const repository = new MockClaimRepository();
    const ai = new StubAIService(
      validAnalysis(),
      new Error("provider unavailable"),
    );
    const result = await submitClaimWorkflow({
      repository,
      aiService: ai,
      submission: makeSubmission(),
      receipt: makeReceipt("ai failure"),
    });
    expect(result.claim.status).toBe("under_review");
    expect(result.claim.recommendation).toBe("review");
    expect(result.claim.receiptAnalysis).toMatchObject({ failed: true });
  });

  it("routes an AI category mismatch to Review", async () => {
    const result = await submit(
      new MockClaimRepository(),
      makeSubmission(),
      validAnalysis({ categorySuggestion: "Venue" }),
      "category mismatch",
    );
    expect(result.claim.recommendation).toBe("review");
    expect(result.claim.recommendationReasons.join(" ")).toMatch(
      /category-conflicting/,
    );
  });

  it("persists approve/reject decisions while approval remains unpaid and transaction-free", async () => {
    const approveRepository = new MockClaimRepository();
    const submitted = await submit(
      approveRepository,
      makeSubmission(),
      validAnalysis(),
      "approve",
    );
    const approved = await approveRepository.decideClaim(
      submitted.claim.id,
      "approve",
      "Receipt and category evidence verified.",
    );
    expect(approved.status).toBe("approved_unpaid");
    expect(approved.paymentStatus).toBe("unpaid");
    expect(approved.approvedSnapshot).toMatchObject({
      recipientSuiAddress: demoSuiAddress,
      amountMinor: 7_500,
    });
    expect(approved.decisionReason).toBe(
      "Receipt and category evidence verified.",
    );

    resetMockClaimStore();
    const rejectRepository = new MockClaimRepository();
    const second = await submit(
      rejectRepository,
      makeSubmission(),
      validAnalysis(),
      "reject",
    );
    const rejected = await rejectRepository.decideClaim(
      second.claim.id,
      "reject",
      "Evidence could not be reconciled.",
    );
    expect(rejected.status).toBe("rejected");
    expect(rejected.paymentStatus).toBe("unpaid");
    expect(rejected.approvedSnapshot).toBeNull();
  });
});

function freshRepository() {
  resetMockClaimStore();
  return new MockClaimRepository();
}

function makeSubmission(
  overrides: Record<string, unknown> = {},
): PersistedClaimSubmission {
  return persistedClaimSubmissionSchema.parse({
    externalReference: randomUUID(),
    workspace: {
      treasuryId: "11111111-1111-4111-8111-111111111111",
      externalReference: "demo-treasury",
      name: "Demo Treasury",
      totalBudgetMinor: 10_000,
      treasuryObjectId: demoSuiAddress,
      categories: [
        {
          externalReference: "marketing",
          name: "Marketing",
          allocatedMinor: 10_000,
          spentMinor: 0,
        },
      ],
    },
    categoryExternalReference: "marketing",
    submitterName: "Aina Rahman",
    merchant: "Campus Print Shop",
    description: "Workshop printing",
    requestedAmountMinor: 7_500,
    receiptAmountMinor: 7_500,
    receiptReference: "RCP-001",
    recipientSuiAddress: demoSuiAddress,
    currency: "USDC",
    ...overrides,
  });
}

function validAnalysis(
  overrides: Record<string, unknown> = {},
): ReceiptAnalysis {
  return receiptAnalysisSchema.parse({
    merchant: "Campus Print Shop",
    amountMinor: 7_500,
    currency: "USDC",
    receiptDate: "2026-08-31",
    description: "Workshop printing",
    categorySuggestion: "Marketing",
    needsReview: false,
    missingFields: [],
    reasons: ["Test receipt analysis"],
    ...overrides,
  });
}

async function submit(
  repository: MockClaimRepository,
  submission: PersistedClaimSubmission,
  analysis: ReceiptAnalysis,
  bytes: string,
) {
  return submitClaimWorkflow({
    repository,
    aiService: new StubAIService(analysis),
    submission,
    receipt: makeReceipt(bytes),
  });
}

function makeReceipt(value: string): File {
  const bytes = Uint8Array.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...new TextEncoder().encode(value),
  ]);
  return {
    name: "receipt.png",
    size: bytes.byteLength,
    type: "image/png",
    arrayBuffer: async () => bytes.buffer,
  } as File;
}

class StubAIService implements AIService {
  constructor(
    private readonly analysis: ReceiptAnalysis,
    private readonly failure?: Error,
  ) {}

  async analyzeReceipt(input: ReceiptAnalysisInput) {
    void input;
    if (this.failure) throw this.failure;
    return structuredClone(this.analysis);
  }

  async parseBudget(input: string): Promise<BudgetDraft> {
    void input;
    throw new Error("Not used by claim workflow tests.");
  }
}
