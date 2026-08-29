import { describe, expect, it } from "vitest";
import {
  getWalletErrorMessage,
  isTestnetAccount,
  shortenSuiAddress,
} from "@/src/lib/sui/wallet-status";

describe("Sui wallet status helpers", () => {
  it("shortens a wallet address without presenting a balance", () => {
    expect(shortenSuiAddress("0x1234567890abcdef")).toBe("0x12345…bcdef");
  });

  it("accepts only the Sui Testnet chain", () => {
    expect(isTestnetAccount(["sui:testnet"])).toBe(true);
    expect(isTestnetAccount(["sui:mainnet"])).toBe(false);
    expect(isTestnetAccount([])).toBe(false);
  });

  it("normalizes unknown wallet errors", () => {
    expect(getWalletErrorMessage(new Error("Request rejected"))).toBe(
      "Request rejected",
    );
    expect(getWalletErrorMessage(null)).toMatch(/did not complete/);
  });
});
