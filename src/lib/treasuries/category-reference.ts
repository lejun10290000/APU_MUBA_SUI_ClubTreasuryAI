export function toSuiCategoryReference(name: string): string {
  const reference = name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-and-/g, "-");

  if (!reference) {
    throw new Error("Category name must produce a non-empty Sui reference.");
  }
  return reference;
}

export function assertUniqueCategoryReferences(
  names: readonly string[],
): void {
  const seen = new Set<string>();
  for (const name of names) {
    const reference = toSuiCategoryReference(name);
    if (seen.has(reference)) {
      throw new Error(
        `Multiple categories produce the same Sui category reference: ${reference}.`,
      );
    }
    seen.add(reference);
  }
}
