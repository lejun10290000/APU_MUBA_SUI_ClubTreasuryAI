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

  return new GeminiAIService({
    apiKey: config.GEMINI_API_KEY,
    model: config.GEMINI_MODEL,
    liveRequestsEnabled: config.GEMINI_LIVE_REQUESTS_ENABLED,
    createClient: dependencies.createGeminiClient,
  });
}
