import { createHash } from "node:crypto";

export const receiptMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ReceiptMimeType = (typeof receiptMimeTypes)[number];

export const maxReceiptBytes = 10 * 1024 * 1024;

export interface ReceiptFileMetadata {
  name: string;
  size: number;
  type: string;
}

export function validateReceiptFile(
  file: ReceiptFileMetadata,
): asserts file is ReceiptFileMetadata & { type: ReceiptMimeType } {
  if (!receiptMimeTypes.includes(file.type as ReceiptMimeType)) {
    throw new Error("Upload a JPEG, PNG, or WebP receipt image.");
  }
  if (!Number.isSafeInteger(file.size) || file.size < 1) {
    throw new Error("The receipt image is empty.");
  }
  if (file.size > maxReceiptBytes) {
    throw new Error("Receipt image must be 10 MB or smaller.");
  }
}

export function hashReceiptBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function validateReceiptBytes(
  bytes: Uint8Array,
  mimeType: ReceiptMimeType,
): void {
  if (bytes.byteLength < 1) {
    throw new Error("The receipt image is empty.");
  }
  if (bytes.byteLength > maxReceiptBytes) {
    throw new Error("Receipt image must be 10 MB or smaller.");
  }

  const hasExpectedSignature =
    mimeType === "image/png"
      ? hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      : mimeType === "image/jpeg"
        ? hasPrefix(bytes, [0xff, 0xd8, 0xff])
        : hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) &&
          hasPrefix(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50]);

  if (!hasExpectedSignature) {
    throw new Error("Receipt bytes do not match the selected image type.");
  }
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

function hasPrefix(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return (
    bytes.byteLength >= prefix.length &&
    prefix.every((value, index) => bytes[index] === value)
  );
}
