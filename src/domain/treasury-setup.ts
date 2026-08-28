import { z } from "zod";
import { parseUsdcDisplay } from "./money";
import { treasurySchema, type Treasury } from "./schemas";

export const demoTreasuryStorageKey = "clubtreasury.demoTreasuryPreview";

export const treasurySetupInputSchema = z
  .object({
    eventName: z
      .string()
      .trim()
      .min(1, "Enter an event or treasury name.")
      .max(80, "Keep the name to 80 characters or fewer."),
    totalBudget: z
      .string()
      .trim()
      .min(1, "Enter a total budget.")
      .superRefine((value, context) => {
        if (!value) {
          return;
        }

        try {
          if (parseUsdcDisplay(value) === 0) {
            context.addIssue({
              code: "custom",
              message: "Budget must be at least 0.01 USDC.",
            });
          }
        } catch (error) {
          context.addIssue({
            code: "custom",
            message:
              error instanceof Error
                ? error.message
                : "Enter a valid USDC amount.",
          });
        }
      }),
  })
  .transform((input) => ({
    eventName: input.eventName,
    totalBudgetMinor: parseUsdcDisplay(input.totalBudget),
  }));

export type TreasurySetupFields = z.input<typeof treasurySetupInputSchema>;

export function buildDemoTreasury(input: TreasurySetupFields): Treasury {
  const setup = treasurySetupInputSchema.parse(input);
  const idSuffix = setup.eventName
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return treasurySchema.parse({
    id: `demo-${idSuffix || "treasury"}`,
    name: setup.eventName,
    currency: "USDC",
    totalBudgetMinor: setup.totalBudgetMinor,
    status: "draft",
  });
}
