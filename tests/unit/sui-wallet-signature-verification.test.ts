import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { isValidPersonalMessageSignature } from "@mysten/sui/verify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidWalletPersonalMessageSignature } from "@/src/lib/sui/wallet-signature-verification";

vi.mock("@mysten/sui/verify", () => ({
  isValidPersonalMessageSignature: vi.fn(),
}));

const mockedVerifier = vi.mocked(isValidPersonalMessageSignature);

describe("Sui wallet signature verification", () => {
  beforeEach(() => {
    mockedVerifier.mockReset();
  });

  it("provides a Testnet Sui client for network-bound zkLogin verification", async () => {
    mockedVerifier.mockResolvedValue(true);
    const message = new TextEncoder().encode("wallet challenge");

    await expect(
      isValidWalletPersonalMessageSignature({
        message,
        signature: "serialized-signature",
        walletAddress: "0x123",
      }),
    ).resolves.toBe(true);

    expect(mockedVerifier).toHaveBeenCalledWith(
      message,
      "serialized-signature",
      {
        address: "0x123",
        client: expect.any(SuiGraphQLClient),
      },
    );
  });
});
