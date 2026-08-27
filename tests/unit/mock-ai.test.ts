import { describe, expect, it } from "vitest";
import { MockAIService } from "@/src/lib/ai/mock";
import { budgetDraftSchema, receiptAnalysisSchema } from "@/src/lib/ai/types";

describe("MockAIService", () => {
  it("returns deterministic schema-valid budget data", async () => {
    const service = new MockAIService();
    const result = await service.parseBudget("ignored in deterministic Stage 1 mock");
    expect(budgetDraftSchema.parse(result).categories.length).toBeGreaterThan(0);
  });

  it("returns deterministic schema-valid receipt analysis", async () => {
    const service = new MockAIService();
    const result = await service.analyzeReceipt({ receiptId: "fixture", requestedAmountMinor: 7500 });
    expect(receiptAnalysisSchema.parse(result).currency).toBe("USDC");
  });
});
