import { describe, expect, it } from "vitest";
import {
  demoSuiAddress,
  persistedClaimSubmissionSchema,
} from "@/src/domain/stage5-claims";

describe("Stage 5 claim validation", () => {
  it("accepts and preserves a valid normalized Sui recipient", () => {
    const result = persistedClaimSubmissionSchema.parse(
      makeSubmission({ recipientSuiAddress: demoSuiAddress }),
    );
    expect(result.recipientSuiAddress).toBe(demoSuiAddress);
  });

  it("rejects invalid recipient addresses and unknown categories", () => {
    expect(() =>
      persistedClaimSubmissionSchema.parse(
        makeSubmission({ recipientSuiAddress: "not-a-sui-address" }),
      ),
    ).toThrow(/valid Sui/);
  });

  it("distinguishes an invalid treasury object ID from an invalid recipient", () => {
    expect(() =>
      persistedClaimSubmissionSchema.parse({
        ...makeSubmission(),
        workspace: {
          ...makeSubmission().workspace,
          treasuryObjectId: "not-a-sui-object-id",
        },
      }),
    ).toThrow(/valid Sui treasury object ID/);
  });

  it("accepts claims for a persisted treasury before it is linked to Sui", () => {
    const result = persistedClaimSubmissionSchema.parse({
      ...makeSubmission(),
      workspace: {
        ...makeSubmission().workspace,
        treasuryId: "11111111-1111-4111-8111-111111111111",
        treasuryObjectId: null,
      },
    });

    expect(result.workspace).toMatchObject({
      treasuryId: "11111111-1111-4111-8111-111111111111",
      treasuryObjectId: null,
    });
  });
});

function makeSubmission(overrides: Record<string, unknown> = {}) {
  return {
    externalReference: "00000000-0000-4000-8000-000000000010",
    workspace: {
      treasuryId: "11111111-1111-4111-8111-111111111111",
      externalReference: "demo-treasury",
      name: "Demo Treasury",
      totalBudgetMinor: 10_000,
      treasuryObjectId: demoSuiAddress,
      categories: [
        {
          externalReference: "marketing",
          name: "Marketing",
          allocatedMinor: 10_000,
          spentMinor: 0,
        },
      ],
    },
    categoryExternalReference: "marketing",
    submitterName: "Aina Rahman",
    merchant: "Campus Print Shop",
    description: "Workshop printing",
    requestedAmountMinor: 7_500,
    receiptAmountMinor: 7_500,
    receiptReference: "RCP-001",
    recipientSuiAddress: demoSuiAddress,
    currency: "USDC",
    ...overrides,
  };
}
