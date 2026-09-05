import { describe, expect, it } from "vitest";

import {
  assertUniqueCategoryReferences,
  toSuiCategoryReference,
} from "@/src/lib/treasuries/category-reference";

describe("A2 category references", () => {
  it.each([
    ["Food", "food"],
    ["Event Marketing", "event-marketing"],
    ["Food & Drinks", "food-drinks"],
  ])("normalizes %s to %s", (name, expected) => {
    expect(toSuiCategoryReference(name)).toBe(expected);
  });

  it("rejects normalized collisions", () => {
    expect(() =>
      assertUniqueCategoryReferences(["Food & Drinks", "Food Drinks"]),
    ).toThrow(/same Sui category reference/i);
  });
});
