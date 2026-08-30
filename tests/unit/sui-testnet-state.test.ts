import { describe, expect, it } from "vitest";
import {
  availableTestnetActions,
  emptyTestnetDemoState,
} from "@/src/lib/sui/testnet-state";

describe("Testnet demo ordering", () => {
  it("unlocks one explicit transaction step at a time", () => {
    expect(availableTestnetActions(emptyTestnetDemoState)).toEqual({
      create: true,
      fund: false,
      allocate: false,
      payout: false,
    });
    expect(
      availableTestnetActions({
        treasuryId: `0x${"1".repeat(64)}`,
        treasurerCapId: `0x${"2".repeat(64)}`,
        digests: { create: "confirmed", fund: "confirmed" },
      }),
    ).toEqual({ create: false, fund: false, allocate: true, payout: false });
  });
});
