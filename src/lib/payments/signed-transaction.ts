import { Transaction } from "@mysten/sui/transactions";

export async function deriveSignedTransactionDigest(
  signedTransactionBase64: string,
): Promise<string> {
  return Transaction.from(signedTransactionBase64).getDigest();
}
