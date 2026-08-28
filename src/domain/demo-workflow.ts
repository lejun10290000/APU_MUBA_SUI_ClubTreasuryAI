import { z } from "zod";
import { checkBudgetTotal } from "./budget-rules";
import { parseUsdcDisplay } from "./money";
import {
  budgetSchema,
  claimRecommendationSchema,
  claimSchema,
  claimStatusSchema,
  type Budget,
  type Treasury,
} from "./schemas";

export const demoBudgetStorageKey = "clubtreasury.demoBudget";
export const demoClaimStorageKey = "clubtreasury.demoClaim";
export const demoDecisionStorageKey = "clubtreasury.demoDecision";
export const demoSessionChangedEvent = "clubtreasury:session-changed";

const allocationInputSchema = z
  .string()
  .trim()
  .min(1, "Enter an allocation.")
  .superRefine((value, context) => {
    if (!value) {
      return;
    }

    try {
      if (parseUsdcDisplay(value) === 0) {
        context.addIssue({
          code: "custom",
          message: "Allocation must be at least 0.01 USDC.",
        });
      }
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Enter a valid USDC allocation.",
      });
    }
  });

export const budgetSetupInputSchema = z
  .object({
    categories: z
      .array(
        z.object({
          name: z
            .string()
            .trim()
            .min(1, "Enter a category name.")
            .max(50, "Keep category names to 50 characters or fewer."),
          allocation: allocationInputSchema,
        }),
      )
      .min(1, "Add at least one budget category.")
      .max(8, "Use no more than 8 categories in the demo."),
  })
  .superRefine((input, context) => {
    const names = new Set<string>();
    input.categories.forEach((category, index) => {
      const normalized = category.name.trim().toLocaleLowerCase("en");
      if (normalized && names.has(normalized)) {
        context.addIssue({
          code: "custom",
          message: "Category names must be unique.",
          path: ["categories", index, "name"],
        });
      }
      names.add(normalized);
    });
  });

export type BudgetSetupFields = z.input<typeof budgetSetupInputSchema>;

export function buildDemoBudget(
  treasury: Treasury,
  input: BudgetSetupFields,
): Budget {
  const setup = budgetSetupInputSchema.parse(input);
  const categories = setup.categories.map((category, index) => ({
    id: `${slugify(category.name) || "category"}-${index + 1}`,
    name: category.name,
    allocatedMinor: parseUsdcDisplay(category.allocation),
    spentMinor: 0,
  }));
  const totalCheck = checkBudgetTotal(
    treasury.totalBudgetMinor,
    categories.map((category) => category.allocatedMinor),
  );

  if (!totalCheck.isBalanced) {
    throw new Error(
      totalCheck.status === "under_allocated"
        ? "Allocate the full treasury total before confirming."
        : "Category allocations cannot exceed the treasury total.",
    );
  }

  return budgetSchema.parse({
    id: `demo-budget-${slugify(treasury.name) || "treasury"}`,
    treasuryId: treasury.id,
    currency: "USDC",
    totalMinor: treasury.totalBudgetMinor,
    status: "confirmed",
    categories,
  });
}

const positiveDisplayAmountSchema = z
  .string()
  .trim()
  .min(1, "Enter a requested amount.")
  .superRefine((value, context) => {
    if (!value) {
      return;
    }

    try {
      if (parseUsdcDisplay(value) === 0) {
        context.addIssue({
          code: "custom",
          message: "Amount must be at least 0.01 USDC.",
        });
      }
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error ? error.message : "Enter a valid USDC amount.",
      });
    }
  });

const optionalDisplayAmountSchema = z
  .string()
  .trim()
  .superRefine((value, context) => {
    if (!value) {
      return;
    }

    try {
      if (parseUsdcDisplay(value) === 0) {
        context.addIssue({
          code: "custom",
          message: "Receipt amount must be at least 0.01 USDC.",
        });
      }
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Enter a valid receipt amount.",
      });
    }
  });

export const claimSubmissionInputSchema = z.object({
  submitterName: z
    .string()
    .trim()
    .min(1, "Enter the member name.")
    .max(80, "Keep the member name to 80 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Describe the expense.")
    .max(180, "Keep the description to 180 characters or fewer."),
  merchant: z
    .string()
    .trim()
    .min(1, "Enter the merchant name.")
    .max(100, "Keep the merchant name to 100 characters or fewer."),
  categoryId: z.string().trim().min(1, "Choose a budget category."),
  requestedAmount: positiveDisplayAmountSchema,
  receiptAmount: optionalDisplayAmountSchema,
  receiptReference: z
    .string()
    .trim()
    .max(100, "Keep the receipt reference to 100 characters or fewer."),
});

export type ClaimSubmissionFields = z.input<typeof claimSubmissionInputSchema>;

export const demoClaimRecordSchema = z.object({
  claim: claimSchema,
  merchant: z.string().trim().min(1),
  receiptReference: z.string().trim().min(1).nullable(),
  submittedLabel: z.string().trim().min(1),
});

export type DemoClaimRecord = z.infer<typeof demoClaimRecordSchema>;

export function buildDemoClaimRecord(
  treasury: Treasury,
  budget: Budget,
  input: ClaimSubmissionFields,
): DemoClaimRecord {
  const setup = claimSubmissionInputSchema.parse(input);
  if (!budget.categories.some((category) => category.id === setup.categoryId)) {
    throw new Error("Choose a category from the active demo budget.");
  }

  const receiptAmountMinor = setup.receiptAmount
    ? parseUsdcDisplay(setup.receiptAmount)
    : null;
  const idSuffix = slugify(
    `${setup.submitterName}-${setup.merchant}-${setup.description}`,
  ).slice(0, 64);

  return demoClaimRecordSchema.parse({
    claim: {
      id: `demo-claim-${idSuffix || "submission"}`,
      treasuryId: treasury.id,
      categoryId: setup.categoryId,
      submitterName: setup.submitterName,
      description: setup.description,
      requestedAmountMinor: parseUsdcDisplay(setup.requestedAmount),
      receiptAmountMinor,
      currency: "USDC",
      status: "under_review",
      recommendation: null,
    },
    merchant: setup.merchant,
    receiptReference: setup.receiptReference || null,
    submittedLabel: "Just now",
  });
}

export const humanDecisionSchema = z.enum(["approve", "reject"]);
export type HumanDecision = z.infer<typeof humanDecisionSchema>;

export const demoDecisionSchema = z.object({
  claimId: z.string().trim().min(1),
  decision: humanDecisionSchema,
  resultingStatus: claimStatusSchema,
  ruleRecommendation: claimRecommendationSchema,
  decidedLabel: z.string().trim().min(1),
});

export type DemoDecision = z.infer<typeof demoDecisionSchema>;

export function buildDemoDecision(
  claimId: string,
  decision: HumanDecision,
  ruleRecommendation: z.infer<typeof claimRecommendationSchema>,
): DemoDecision {
  return demoDecisionSchema.parse({
    claimId,
    decision,
    resultingStatus: decision === "approve" ? "approved_unpaid" : "rejected",
    ruleRecommendation,
    decidedLabel: "Just now",
  });
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
