import { z } from "zod";
import { asMinorAmount } from "../money";

const identifierSchema = z.string().trim().min(1);
const displayNameSchema = z.string().trim().min(1);

export const currencySchema = z.literal("USDC");

export const nonNegativeMinorAmountSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
  .transform(asMinorAmount);

export const positiveMinorAmountSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER)
  .transform(asMinorAmount);

export const treasuryStatusSchema = z.enum(["draft", "active", "closed"]);
export const budgetStatusSchema = z.enum(["draft", "confirmed"]);
export const claimStatusSchema = z.enum([
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "approved_unpaid",
  "paid",
]);
export const claimRecommendationSchema = z.enum([
  "approve",
  "review",
  "reject",
]);

export const treasurySchema = z.object({
  id: identifierSchema,
  name: displayNameSchema,
  currency: currencySchema,
  totalBudgetMinor: positiveMinorAmountSchema,
  status: treasuryStatusSchema,
});

export const budgetCategorySchema = z
  .object({
    id: identifierSchema,
    name: displayNameSchema,
    allocatedMinor: positiveMinorAmountSchema,
    spentMinor: nonNegativeMinorAmountSchema,
  })
  .superRefine((category, context) => {
    if (category.spentMinor > category.allocatedMinor) {
      context.addIssue({
        code: "custom",
        message: "Spent amount cannot exceed the category allocation.",
        path: ["spentMinor"],
      });
    }
  });

export const budgetSchema = z
  .object({
    id: identifierSchema,
    treasuryId: identifierSchema,
    currency: currencySchema,
    totalMinor: positiveMinorAmountSchema,
    status: budgetStatusSchema,
    categories: z.array(budgetCategorySchema).min(1),
  })
  .superRefine((budget, context) => {
    const categoryIds = new Set<string>();
    const categoryNames = new Set<string>();

    budget.categories.forEach((category, index) => {
      const normalizedName = category.name.toLocaleLowerCase("en");

      if (categoryIds.has(category.id)) {
        context.addIssue({
          code: "custom",
          message: "Budget category IDs must be unique.",
          path: ["categories", index, "id"],
        });
      }

      if (categoryNames.has(normalizedName)) {
        context.addIssue({
          code: "custom",
          message: "Budget category names must be unique.",
          path: ["categories", index, "name"],
        });
      }

      categoryIds.add(category.id);
      categoryNames.add(normalizedName);
    });
  });

export const claimSchema = z.object({
  id: identifierSchema,
  treasuryId: identifierSchema,
  categoryId: identifierSchema,
  submitterName: displayNameSchema,
  description: z.string().trim().min(1),
  requestedAmountMinor: positiveMinorAmountSchema,
  receiptAmountMinor: positiveMinorAmountSchema.nullable(),
  currency: currencySchema,
  status: claimStatusSchema,
  recommendation: claimRecommendationSchema.nullable(),
});

export type Currency = z.infer<typeof currencySchema>;
export type TreasuryStatus = z.infer<typeof treasuryStatusSchema>;
export type BudgetStatus = z.infer<typeof budgetStatusSchema>;
export type ClaimStatus = z.infer<typeof claimStatusSchema>;
export type ClaimRecommendation = z.infer<typeof claimRecommendationSchema>;
export type Treasury = z.infer<typeof treasurySchema>;
export type BudgetCategory = z.infer<typeof budgetCategorySchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type Claim = z.infer<typeof claimSchema>;
