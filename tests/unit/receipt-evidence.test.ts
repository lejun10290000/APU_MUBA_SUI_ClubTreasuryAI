import { describe, expect, it } from "vitest";
import {
  buildReceiptStoragePath,
  hashReceiptBytes,
  maxReceiptBytes,
  validateReceiptBytes,
  validateReceiptFile,
} from "@/src/domain/receipt-evidence";

describe("receipt evidence", () => {
  it("creates a deterministic lowercase SHA-256 hash from file bytes", () => {
    expect(hashReceiptBytes(new TextEncoder().encode("receipt fixture"))).toBe(
      "ce115ed2c916362309d242c8cbbc2820b6ba6ca3c2e9be747c178745f0ad273f",
    );
  });

  it("accepts only supported non-empty receipt images up to 10 MB", () => {
    expect(() =>
      validateReceiptFile({ name: "receipt.png", type: "image/png", size: 12 }),
    ).not.toThrow();
    expect(() =>
      validateReceiptFile({
        name: "receipt.pdf",
        type: "application/pdf",
        size: 12,
      }),
    ).toThrow(/JPEG, PNG, or WebP/);
    expect(() =>
      validateReceiptFile({ name: "empty.png", type: "image/png", size: 0 }),
    ).toThrow(/empty/);
    expect(() =>
      validateReceiptFile({
        name: "large.webp",
        type: "image/webp",
        size: maxReceiptBytes + 1,
      }),
    ).toThrow(/10 MB/);
  });

  it("uses an owner-scoped immutable storage path", () => {
    expect(
      buildReceiptStoragePath({
        userId: "user-id",
        claimReference: "claim-id",
        mimeType: "image/jpeg",
      }),
    ).toBe("user-id/claim-id/receipt");
  });

  it("rejects bytes whose signature does not match the declared image type", () => {
    expect(() =>
      validateReceiptBytes(
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        "image/png",
      ),
    ).not.toThrow();
    expect(() =>
      validateReceiptBytes(
        new TextEncoder().encode("not an image"),
        "image/png",
      ),
    ).toThrow(/do not match/);
  });
});
