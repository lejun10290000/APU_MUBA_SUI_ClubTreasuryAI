import { describe, expect, it } from "vitest";
import {
  buildDemoTreasury,
  treasurySetupInputSchema,
} from "@/src/domain/treasury-setup";

describe("demo treasury setup", () => {
  it("builds a schema-valid draft treasury in integer minor units", () => {
    expect(
      buildDemoTreasury({
        eventName: "Orientation Night 2026",
        totalBudget: "1250.50",
      }),
    ).toEqual({
      id: "demo-orientation-night-2026",
      name: "Orientation Night 2026",
      currency: "USDC",
      totalBudgetMinor: 125_050,
      status: "draft",
    });
  });

  it.each([
    [{ eventName: "", totalBudget: "100" }, "Enter an event or treasury name."],
    [
      { eventName: "Orientation Night", totalBudget: "0" },
      "Budget must be at least 0.01 USDC.",
    ],
    [
      { eventName: "Orientation Night", totalBudget: "12.345" },
      "Enter a valid USDC amount with up to 2 decimal places.",
    ],
  ])("rejects invalid setup data", (input, message) => {
    const result = treasurySetupInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        message,
      );
    }
  });
});
