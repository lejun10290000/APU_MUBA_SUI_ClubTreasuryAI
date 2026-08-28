export type MinorAmount = number & { readonly __minorAmount: unique symbol };

export function asMinorAmount(value: number): MinorAmount {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      "Money must be represented as a non-negative safe integer in minor units.",
    );
  }
  return value as MinorAmount;
}

export function addMinorAmounts(...values: MinorAmount[]): MinorAmount {
  const total = values.reduce((sum, value) => sum + value, 0);
  return asMinorAmount(total);
}

export function formatUsdcMinor(value: MinorAmount): string {
  return `${(value / 100).toFixed(2)} USDC`;
}

export function parseUsdcDisplay(value: string): MinorAmount {
  const normalized = value.trim();
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(normalized);

  if (!match) {
    throw new Error("Enter a valid USDC amount with up to 2 decimal places.");
  }

  const wholeUnits = BigInt(match[1]);
  const fractionalUnits = BigInt((match[2] ?? "").padEnd(2, "0") || "0");
  const minorUnits = wholeUnits * 100n + fractionalUnits;

  if (minorUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("The USDC amount is too large.");
  }

  return asMinorAmount(Number(minorUnits));
}
