import { describe, expect, it } from "vitest";
import {
  addMinorAmounts,
  asMinorAmount,
  formatUsdcMinor,
  parseUsdcDisplay,
} from "@/src/domain/money";

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

  it.each([
    ["0.01", 1],
    ["12.5", 1_250],
    ["2500.00", 250_000],
    [" 75 ", 7_500],
  ])("parses %s USDC without floating-point arithmetic", (display, minor) => {
    expect(parseUsdcDisplay(display)).toBe(minor);
  });

  it.each(["", "01.00", "1.234", "1,000", "-5", "five"])(
    "rejects invalid USDC display amount %s",
    (display) => {
      expect(() => parseUsdcDisplay(display)).toThrow();
    },
  );
});
