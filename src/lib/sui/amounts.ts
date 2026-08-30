import { SuiIntegrationError } from "./errors";

export function parseCoinAmount(value: string, decimals: number) {
  const normalized = value.trim();
  if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new SuiIntegrationError(
      "COIN_METADATA_UNAVAILABLE",
      "The coin decimals returned by Testnet are not supported.",
      "on-chain",
    );
  }
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(normalized)) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      "Enter a positive decimal amount without commas or exponents.",
    );
  }
  const [whole, fraction = ""] = normalized.split(".");
  if (fraction.length > decimals) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      `This coin supports at most ${decimals} decimal places.`,
    );
  }
  const units =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0");
  if (units <= 0n) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      "The amount must be greater than zero.",
    );
  }
  return units;
}

export function formatCoinAmount(value: string | bigint, decimals: number) {
  const units = BigInt(value);
  const scale = 10n ** BigInt(decimals);
  const whole = units / scale;
  const fraction = (units % scale).toString().padStart(decimals, "0");
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}
