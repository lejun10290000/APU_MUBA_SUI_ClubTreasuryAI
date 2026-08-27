import type { AIService, BudgetDraft, ReceiptAnalysis } from "./types";

const defaultBudget: BudgetDraft = {
  currency: "USDC",
  categories: [
    { name: "Food", amountMinor: 30000 },
    { name: "Marketing", amountMinor: 20000 },
    { name: "Venue", amountMinor: 25000 },
    { name: "Prizes", amountMinor: 15000 },
    { name: "Emergency", amountMinor: 10000 },
  ],
  notes: ["Deterministic Stage 1 mock fixture"],
};

const defaultReceipt: ReceiptAnalysis = {
  merchant: "Campus Print Shop",
  amountMinor: 7500,
  currency: "USDC",
  categorySuggestion: "Marketing",
  needsReview: false,
  reasons: ["Schema-valid deterministic mock response"],
};

export class MockAIService implements AIService {
  async parseBudget(input: string): Promise<BudgetDraft> {
    void input;
    return structuredClone(defaultBudget);
  }

  async analyzeReceipt(input: { receiptId: string; requestedAmountMinor: number }): Promise<ReceiptAnalysis> {
    void input;
    return structuredClone(defaultReceipt);
  }
}
