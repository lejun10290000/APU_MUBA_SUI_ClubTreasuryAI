export type MinorAmount = number & { readonly __minorAmount: unique symbol };

export function asMinorAmount(value: number): MinorAmount {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("Money must be represented as a non-negative safe integer in minor units.");
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
