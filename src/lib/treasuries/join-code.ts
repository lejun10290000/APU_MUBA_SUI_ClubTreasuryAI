import { createHash, randomBytes as createRandomBytes } from "node:crypto";

export function normalizeJoinCode(value: string): string {
  return value.trim().toUpperCase();
}

export function generateJoinCode(randomBytes?: Uint8Array): string {
  const entropy = randomBytes ?? createRandomBytes(16);
  const encoded = createHash("sha256")
    .update(entropy)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();

  return `${encoded.slice(0, 4)}-${encoded.slice(4)}`;
}
