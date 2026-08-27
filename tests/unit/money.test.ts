import { describe, expect, it } from "vitest";
import { addMinorAmounts, asMinorAmount, formatUsdcMinor } from "@/src/domain/money";

describe("money helpers", () => {
  it("keeps financial arithmetic in integer minor units", () => {
    const total = addMinorAmounts(asMinorAmount(1000), asMinorAmount(250));
    expect(total).toBe(1250);
    expect(formatUsdcMinor(total)).toBe("12.50 USDC");
  });

  it("rejects unsafe or fractional values", () => {
    expect(() => asMinorAmount(1.5)).toThrow();
    expect(() => asMinorAmount(-1)).toThrow();
  });
});
