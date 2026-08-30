import { describe, expect, it } from "vitest";
import { formatCoinAmount, parseCoinAmount } from "@/src/lib/sui/amounts";

describe("Sui coin amount conversion", () => {
  it("converts decimal text to exact metadata-derived base units", () => {
    expect(parseCoinAmount("1.000001", 6)).toBe(1_000_001n);
    expect(parseCoinAmount("42", 6)).toBe(42_000_000n);
    expect(formatCoinAmount("1000001", 6)).toBe("1.000001");
  });

  it("rejects precision loss, floats, exponents, and zero", () => {
    for (const value of ["0", "1.0000001", "1e3", "1,000", "-1"]) {
      expect(() => parseCoinAmount(value, 6)).toThrow();
    }
  });
});
