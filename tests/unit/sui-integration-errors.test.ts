import { describe, expect, it } from "vitest";
import { assertWalletCanSign, SuiIntegrationError } from "@/src/lib/sui/errors";

describe("Sui integration error boundaries", () => {
  it("distinguishes disconnected and wrong-network wallet errors", () => {
    expect(() =>
      assertWalletCanSign({ connected: false, network: null }),
    ).toThrowError(SuiIntegrationError);
    try {
      assertWalletCanSign({ connected: true, network: "mainnet" });
    } catch (error) {
      expect(error).toMatchObject({
        code: "WRONG_NETWORK",
        source: "wallet",
      });
    }
  });

  it("accepts a connected Testnet wallet without signing anything", () => {
    expect(() =>
      assertWalletCanSign({ connected: true, network: "testnet" }),
    ).not.toThrow();
  });
});
