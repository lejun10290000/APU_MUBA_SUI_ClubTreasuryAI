import { describe, expect, it } from "vitest";

import { selectUsdcCoins } from "@/src/lib/sui/usdc-coin-selection";

describe("A2 USDC coin selection", () => {
  it("selects the smallest deterministic descending prefix", () => {
    const selected = selectUsdcCoins(
      [
        { coinObjectId: "0x1", balance: "6000000" },
        { coinObjectId: "0x2", balance: "5000000" },
        { coinObjectId: "0x3", balance: "14000000" },
      ],
      10_000_000n,
    );

    expect(selected.totalAvailable).toBe(25_000_000n);
    expect(selected.selectedIds).toEqual(["0x3"]);
    expect(selected.selectedBalance).toBe(14_000_000n);
  });

  it("combines smaller coins and rejects insufficient total balance", () => {
    expect(
      selectUsdcCoins(
        [
          { coinObjectId: "0x1", balance: "6000000" },
          { coinObjectId: "0x2", balance: "5000000" },
        ],
        10_000_000n,
      ).selectedIds,
    ).toEqual(["0x1", "0x2"]);
    expect(() =>
      selectUsdcCoins(
        [{ coinObjectId: "0x1", balance: "9999999" }],
        10_000_000n,
      ),
    ).toThrow(/insufficient/i);
  });
});
