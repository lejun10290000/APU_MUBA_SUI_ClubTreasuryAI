import { createHash } from "node:crypto";
import type { ReceiptMimeType } from "./receipt-validation";

export {
  maxReceiptBytes,
  receiptMimeTypes,
  validateReceiptBytes,
  validateReceiptFile,
  type ReceiptFileMetadata,
  type ReceiptMimeType,
} from "./receipt-validation";

export function hashReceiptBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function buildReceiptStoragePath({
  userId,
  claimReference,
  mimeType,
}: {
  userId: string;
  claimReference: string;
  mimeType: ReceiptMimeType;
}): string {
  void mimeType;
  return `${userId}/${claimReference}/receipt`;
}
