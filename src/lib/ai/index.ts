import { serverConfig } from "@/src/config/env";
import { MockAIService } from "./mock";
import type { AIService } from "./types";

export function getAIService(): AIService {
  if (serverConfig.AI_MODE === "mock") {
    return new MockAIService();
  }

  throw new Error(
    "Live Gemini integration is intentionally unavailable in Stage 1. Implement GeminiAIService only in Stage 4.",
  );
}
