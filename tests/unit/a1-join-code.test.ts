import { describe, expect, it } from "vitest";

import {
  generateJoinCode,
  normalizeJoinCode,
} from "@/src/lib/treasuries/join-code";

describe("A1 treasury join codes", () => {
  it("normalizes user-entered codes without changing their structure", () => {
    expect(normalizeJoinCode(" ori1-ab12cd ")).toBe("ORI1-AB12CD");
  });

  it("derives a stable valid code from supplied entropy", () => {
    expect(generateJoinCode(new Uint8Array([1, 2, 3, 4, 5]))).toMatch(
      /^[A-Z0-9]{4}-[A-Z0-9]{6}$/,
    );
    expect(generateJoinCode(new Uint8Array([1, 2, 3, 4, 5]))).toBe(
      generateJoinCode(new Uint8Array([1, 2, 3, 4, 5])),
    );
  });
});
