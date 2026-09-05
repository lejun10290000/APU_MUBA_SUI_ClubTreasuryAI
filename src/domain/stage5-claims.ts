import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";
import { z } from "zod";
import { asMinorAmount } from "./money";
import {
  claimRecommendationSchema,
  currencySchema,
  positiveMinorAmountSchema,
} from "./schemas";

function createSuiAddressSchema(message: string) {
  return z
    .string()
    .trim()
    .refine(isValidSuiAddress, message)
    .transform((value) => normalizeSuiAddress(value));
}

export const treasurySuiObjectIdSchema = createSuiAddressSchema(
  "Enter a valid Sui treasury object ID.",
);
export const recipientSuiAddressSchema = createSuiAddressSchema(
  "Enter a valid Sui recipient address.",
);
const walletSuiAddressSchema = createSuiAddressSchema(
  "The member wallet address is invalid.",
);

const externalReferenceSchema = z.string().trim().min(1).max(160);

export const claimWorkspaceSchema = z.object({
  treasuryId: z.string().uuid(),
  externalReference: externalReferenceSchema,
  name: z.string().trim().min(1).max(120),
  totalBudgetMinor: positiveMinorAmountSchema,
  treasuryObjectId: treasurySuiObjectIdSchema.nullable(),
  categories: z
    .array(
      z.object({
        externalReference: externalReferenceSchema,
        name: z.string().trim().min(1).max(80),
        allocatedMinor: positiveMinorAmountSchema,
        spentMinor: z
          .number()
          .int()
          .nonnegative()
          .max(Number.MAX_SAFE_INTEGER)
          .transform(asMinorAmount),
      }),
    )
    .min(1)
    .max(12),
});

export const persistedClaimSubmissionSchema = z.object({
  externalReference: z.string().uuid(),
  workspace: claimWorkspaceSchema,
  categoryExternalReference: externalReferenceSchema,
  submitterName: z.string().trim().min(1).max(80),
  merchant: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(240),
  requestedAmountMinor: positiveMinorAmountSchema,
  receiptAmountMinor: positiveMinorAmountSchema.nullable(),
  receiptReference: z.string().trim().max(100).nullable(),
  // Legacy clients may send this value, but the server always derives the
  // authoritative payout recipient from the verified wallet principal.
  recipientSuiAddress: recipientSuiAddressSchema.optional(),
  currency: currencySchema.default("USDC"),
});

export const claimDecisionInputSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().min(1).max(240),
});

export const persistedClaimSchema = z.object({
  id: z.string().uuid(),
  externalReference: z.string(),
  treasuryId: z.string().uuid(),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  categoryExternalReference: z.string(),
  treasuryObjectId: treasurySuiObjectIdSchema.nullable(),
  memberWalletAddress: walletSuiAddressSchema,
  recipientSuiAddress: recipientSuiAddressSchema,
  submitterName: z.string(),
  merchant: z.string(),
  description: z.string(),
  requestedAmountMinor: positiveMinorAmountSchema,
  receiptAmountMinor: positiveMinorAmountSchema.nullable(),
  receiptReference: z.string().nullable(),
  receiptHash: z.string().regex(/^[0-9a-f]{64}$/),
  receiptMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  receiptSizeBytes: z.number().int().positive(),
  receiptAnalysis: z.unknown().nullable(),
  duplicateMatch: z.object({
    exactIds: z.array(z.string()),
    similarIds: z.array(z.string()),
  }),
  recommendation: claimRecommendationSchema.nullable(),
  recommendationReasons: z.array(z.string()),
  status: z.enum([
    "submitted",
    "under_review",
    "approved_unpaid",
    "rejected",
    "paid",
  ]),
  decision: z.enum(["approve", "reject"]).nullable(),
  decisionReason: z.string().nullable(),
  paymentStatus: z.enum(["unpaid", "paid"]),
  approvedSnapshot: z
    .object({
      treasuryObjectId: treasurySuiObjectIdSchema,
      categoryReference: z.string(),
      recipientSuiAddress: recipientSuiAddressSchema,
      amountMinor: positiveMinorAmountSchema,
      currency: currencySchema,
    })
    .nullable(),
  createdAt: z.string(),
  decidedAt: z.string().nullable(),
  confirmedTransactionDigest: z.string().nullable().default(null),
  paidAt: z.string().nullable().default(null),
});

export type PersistedClaimSubmission = z.infer<
  typeof persistedClaimSubmissionSchema
>;
export type PersistedClaim = z.infer<typeof persistedClaimSchema>;
export type ClaimDecisionInput = z.infer<typeof claimDecisionInputSchema>;

export const demoSuiAddress =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
