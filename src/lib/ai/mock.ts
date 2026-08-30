import {
  budgetDraftSchema,
  receiptAnalysisSchema,
  type AIService,
  type BudgetDraft,
  type ReceiptAnalysis,
  type ReceiptAnalysisInput,
} from "./types";

const defaultBudget = budgetDraftSchema.parse({
  currency: "USDC",
  categories: [
    { name: "Food", amountMinor: 30000 },
    { name: "Marketing", amountMinor: 20000 },
    { name: "Venue", amountMinor: 25000 },
    { name: "Prizes", amountMinor: 15000 },
    { name: "Emergency", amountMinor: 10000 },
  ],
  notes: ["Deterministic mock fixture; no live Gemini call"],
});

const defaultReceipt = receiptAnalysisSchema.parse({
  merchant: "Campus Print Shop",
  amountMinor: 7500,
  currency: "USDC",
  receiptDate: "2026-08-28",
  description: "Workshop printing",
  categorySuggestion: "Marketing",
  needsReview: false,
  missingFields: [],
  reasons: ["Schema-valid deterministic mock response"],
});

export class MockAIService implements AIService {
  async parseBudget(input: string): Promise<BudgetDraft> {
    void input;
    return structuredClone(defaultBudget);
  }

  async analyzeReceipt(input: ReceiptAnalysisInput): Promise<ReceiptAnalysis> {
    void input;
    return structuredClone(defaultReceipt);
  }
}
