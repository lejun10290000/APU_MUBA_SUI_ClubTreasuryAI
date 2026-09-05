import { serverConfig } from "@/src/config/env";
import { GeminiAIService, type GeminiClientFactory } from "./gemini";
import { MockAIService } from "./mock";
import type { AIService } from "./types";

export interface AIServiceConfig {
  AI_MODE: "mock" | "live";
  GEMINI_API_KEY?: string;
  GEMINI_MODEL: string;
  GEMINI_LIVE_REQUESTS_ENABLED: boolean;
}

export interface AIServiceDependencies {
  createGeminiClient?: GeminiClientFactory;
}

export function getAIService(
  config: AIServiceConfig = serverConfig,
  dependencies: AIServiceDependencies = {},
): AIService {
  if (config.AI_MODE === "mock") {
    return new MockAIService();
  }
  if (!config.GEMINI_LIVE_REQUESTS_ENABLED) {
    throw new Error("Live Gemini requests are disabled.");
  }
  if (!config.GEMINI_API_KEY?.trim()) {
    throw new Error("Gemini API key is not configured.");
  }

  return new GeminiAIService({
    apiKey: config.GEMINI_API_KEY,
    model: config.GEMINI_MODEL,
    liveRequestsEnabled: config.GEMINI_LIVE_REQUESTS_ENABLED,
    createClient: dependencies.createGeminiClient,
  });
}

export function getClaimAIService(
  config: AIServiceConfig = serverConfig,
  dependencies: AIServiceDependencies = {},
): AIService {
  try {
    return getAIService(config, dependencies);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Live Gemini is not configured.";
    return {
      async analyzeReceipt() {
        throw new Error(`Gemini analysis was unavailable. ${reason}`);
      },
      async parseBudget() {
        throw new Error(`Gemini analysis was unavailable. ${reason}`);
      },
    };
  }
}
