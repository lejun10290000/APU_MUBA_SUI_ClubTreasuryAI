import { describe, expect, it, vi } from "vitest";
import { getAIService } from "@/src/lib/ai";
import { GeminiAIService } from "@/src/lib/ai/gemini";
import { MockAIService } from "@/src/lib/ai/mock";

const baseConfig = {
  GEMINI_MODEL: "gemini-2.5-flash",
  GEMINI_LIVE_REQUESTS_ENABLED: false,
} as const;

describe("AI service selection and mock safety", () => {
  it("returns the deterministic mock without constructing a Gemini client", async () => {
    const createGeminiClient = vi.fn(() => {
      throw new Error("Gemini client must not be constructed in mock mode.");
    });
    const service = getAIService(
      { ...baseConfig, AI_MODE: "mock" },
      { createGeminiClient },
    );

    expect(service).toBeInstanceOf(MockAIService);
    await expect(service.parseBudget("mock-only input")).resolves.toMatchObject(
      {
        currency: "USDC",
      },
    );
    expect(createGeminiClient).not.toHaveBeenCalled();
  });

  it("selects Gemini in live mode without constructing a client eagerly", async () => {
    const createGeminiClient = vi.fn(() => {
      throw new Error("Construction should be lazy.");
    });
    const service = getAIService(
      {
        ...baseConfig,
        AI_MODE: "live",
        GEMINI_API_KEY: "test-only-key",
      },
      { createGeminiClient },
    );

    expect(service).toBeInstanceOf(GeminiAIService);
    expect(createGeminiClient).not.toHaveBeenCalled();
    await expect(
      service.parseBudget("Allocate 10 USDC to food."),
    ).rejects.toMatchObject({ code: "LIVE_REQUESTS_DISABLED" });
    expect(createGeminiClient).not.toHaveBeenCalled();
  });
});
