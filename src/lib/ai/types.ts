import { z } from "zod";
import {
  currencySchema,
  nonNegativeMinorAmountSchema,
  positiveMinorAmountSchema,
} from "@/src/domain/schemas";

const conciseTextSchema = z.string().trim().min(1).max(240);
const categoryNameSchema = z.string().trim().min(1).max(80);

export const budgetDraftSchema = z
  .object({
    currency: currencySchema,
    categories: z
      .array(
        z.object({
          name: categoryNameSchema,
          amountMinor: nonNegativeMinorAmountSchema,
        }),
      )
      .min(1)
      .max(12),
    notes: z.array(conciseTextSchema).max(8).default([]),
  })
  .superRefine((draft, context) => {
    const names = new Set<string>();

    draft.categories.forEach((category, index) => {
      const normalized = category.name.toLocaleLowerCase("en");
      if (names.has(normalized)) {
        context.addIssue({
          code: "custom",
          message: "AI budget category names must be unique.",
          path: ["categories", index, "name"],
        });
      }
      names.add(normalized);
    });
  });

export const receiptMissingFieldSchema = z.enum([
  "merchant",
  "amount",
  "currency",
  "date",
  "description",
  "category",
]);

export const receiptAnalysisSchema = z
  .object({
    merchant: z.string().trim().min(1).max(120).nullable(),
    amountMinor: nonNegativeMinorAmountSchema.nullable(),
    currency: currencySchema,
    receiptDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    description: z.string().trim().min(1).max(240).nullable(),
    categorySuggestion: categoryNameSchema.nullable(),
    needsReview: z.boolean(),
    missingFields: z.array(receiptMissingFieldSchema).max(6).default([]),
    reasons: z.array(conciseTextSchema).min(1).max(8),
  })
  .superRefine((analysis, context) => {
    const evidenceIsIncomplete =
      analysis.merchant === null ||
      analysis.amountMinor === null ||
      analysis.missingFields.length > 0;

    if (evidenceIsIncomplete && !analysis.needsReview) {
      context.addIssue({
        code: "custom",
        message: "Incomplete receipt evidence must require human review.",
        path: ["needsReview"],
      });
    }
  });

const receiptImageBase64Schema = z
  .string()
  .trim()
  .min(4)
  .max(13_981_016, "Receipt image must be 10 MB or smaller.")
  .refine(
    (value) => value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value),
    "Receipt image must be valid base64 without a data-URL prefix.",
  );

export const receiptAnalysisInputSchema = z.object({
  receiptId: z.string().trim().min(1).max(120),
  requestedAmountMinor: positiveMinorAmountSchema,
  image: z
    .object({
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      base64: receiptImageBase64Schema,
    })
    .optional(),
});

export const budgetInstructionSchema = z.string().trim().min(1).max(4_000);

export type BudgetDraft = z.infer<typeof budgetDraftSchema>;
export type ReceiptAnalysis = z.infer<typeof receiptAnalysisSchema>;
export type ReceiptAnalysisInput = z.input<typeof receiptAnalysisInputSchema>;

export interface AIService {
  parseBudget(input: string): Promise<BudgetDraft>;
  analyzeReceipt(input: ReceiptAnalysisInput): Promise<ReceiptAnalysis>;
}
