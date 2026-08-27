import { z } from "zod";

export const budgetDraftSchema = z.object({
  currency: z.literal("USDC"),
  categories: z.array(
    z.object({
      name: z.string().min(1),
      amountMinor: z.number().int().nonnegative(),
    }),
  ),
  notes: z.array(z.string()).default([]),
});

export const receiptAnalysisSchema = z.object({
  merchant: z.string().nullable(),
  amountMinor: z.number().int().nonnegative().nullable(),
  currency: z.literal("USDC"),
  categorySuggestion: z.string().nullable(),
  needsReview: z.boolean(),
  reasons: z.array(z.string()),
});

export type BudgetDraft = z.infer<typeof budgetDraftSchema>;
export type ReceiptAnalysis = z.infer<typeof receiptAnalysisSchema>;

export interface AIService {
  parseBudget(input: string): Promise<BudgetDraft>;
  analyzeReceipt(input: { receiptId: string; requestedAmountMinor: number }): Promise<ReceiptAnalysis>;
}
