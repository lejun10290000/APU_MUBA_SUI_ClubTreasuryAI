import { Transaction } from "@mysten/sui/transactions";
import { toBase64 } from "@mysten/sui/utils";
import { describe, expect, it } from "vitest";
import { demoSuiAddress } from "@/src/domain/stage5-claims";
import { deriveSignedTransactionDigest } from "@/src/lib/payments/signed-transaction";

describe("signed payout digest evidence", () => {
  it("derives the digest from the exact wallet-signed transaction bytes", async () => {
    const transaction = new Transaction();
    transaction.setSender(demoSuiAddress);
    transaction.setGasPrice(1_000);
    transaction.setGasBudget(10_000_000);
    transaction.setGasPayment([
      {
        objectId: demoSuiAddress,
        version: "1",
        digest: "11111111111111111111111111111111",
      },
    ]);
    const bytes = await transaction.build();

    await expect(deriveSignedTransactionDigest(toBase64(bytes))).resolves.toBe(
      await transaction.getDigest(),
    );
  });

  it("rejects malformed transaction bytes", async () => {
    await expect(
      deriveSignedTransactionDigest("c2lnbmVkLXR4"),
    ).rejects.toThrow();
  });
});
