import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  demoSuiAddress,
  persistedClaimSubmissionSchema,
} from "@/src/domain/stage5-claims";
import { getAIService, getClaimAIService } from "@/src/lib/ai";
import { MockAIService } from "@/src/lib/ai/mock";
import {
  MockClaimRepository,
  resetMockClaimStore,
} from "@/src/lib/claims/mock-repository";
import { submitClaimWorkflow } from "@/src/lib/claims/service";

describe("A2 production Gemini fail-closed behavior", () => {
  beforeEach(() => resetMockClaimStore());

  it("persists manual review on a Gemini provider failure without using mock AI", async () => {
    const mockAnalyze = vi.spyOn(MockAIService.prototype, "analyzeReceipt");
    const generateContent = vi.fn().mockRejectedValue(new Error("offline"));
    const aiService = getAIService(
      {
        AI_MODE: "live",
        GEMINI_API_KEY: "test-only-not-a-secret",
        GEMINI_MODEL: "gemini-2.5-flash",
        GEMINI_LIVE_REQUESTS_ENABLED: true,
      },
      {
        createGeminiClient: vi.fn().mockResolvedValue({
          models: { generateContent },
        }),
      },
    );

    const result = await submitClaimWorkflow({
      repository: new MockClaimRepository(),
      aiService,
      submission: persistedClaimSubmissionSchema.parse({
        externalReference: randomUUID(),
        workspace: {
          treasuryId: "11111111-1111-4111-8111-111111111111",
          externalReference: "a2-live-ai",
          name: "A2 Live AI",
          totalBudgetMinor: 1_000,
          treasuryObjectId: demoSuiAddress,
          categories: [
            {
              externalReference: "events",
              name: "Events",
              allocatedMinor: 1_000,
              spentMinor: 0,
            },
          ],
        },
        categoryExternalReference: "events",
        submitterName: "Verified member",
        merchant: "Campus vendor",
        description: "Synthetic acceptance receipt",
        requestedAmountMinor: 100,
        receiptAmountMinor: 100,
        receiptReference: "A2-AI-FAIL",
        currency: "USDC",
      }),
      receipt: pngReceipt(),
    });

    expect(generateContent).toHaveBeenCalledOnce();
    expect(mockAnalyze).not.toHaveBeenCalled();
    expect(result.claim).toMatchObject({
      status: "under_review",
      recommendation: "review",
      receiptAnalysis: {
        failed: true,
        message: expect.stringMatching(/Gemini analysis was unavailable/i),
      },
    });
  });

  it("rejects incomplete live configuration before constructing a provider", () => {
    expect(() =>
      getAIService({
        AI_MODE: "live",
        GEMINI_API_KEY: "test-only-not-a-secret",
        GEMINI_MODEL: "gemini-2.5-flash",
        GEMINI_LIVE_REQUESTS_ENABLED: false,
      }),
    ).toThrow("Live Gemini requests are disabled.");
    expect(() =>
      getAIService({
        AI_MODE: "live",
        GEMINI_MODEL: "gemini-2.5-flash",
        GEMINI_LIVE_REQUESTS_ENABLED: true,
      }),
    ).toThrow("Gemini API key is not configured.");
  });

  it("turns incomplete live claim configuration into an explicit unavailable service, never mock", async () => {
    const service = getClaimAIService({
      AI_MODE: "live",
      GEMINI_MODEL: "gemini-2.5-flash",
      GEMINI_LIVE_REQUESTS_ENABLED: true,
    });

    expect(service).not.toBeInstanceOf(MockAIService);
    await expect(
      service.analyzeReceipt({
        receiptId: "synthetic",
        requestedAmountMinor: 100,
      }),
    ).rejects.toThrow(/Gemini analysis was unavailable.*API key/i);
  });
});

function pngReceipt(): File {
  const bytes = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3,
  ]);
  return {
    name: "receipt.png",
    size: bytes.byteLength,
    type: "image/png",
    arrayBuffer: async () => bytes.buffer,
  } as File;
}
