import { asMinorAmount, type MinorAmount } from "@/src/domain/money";
import { SuiIntegrationError } from "./errors";

const USDC_BASE_UNITS_PER_APP_MINOR = 10_000n;

export function assertSuiTestnet(
  network: string | null | undefined,
): "testnet" {
  if (network !== "testnet") {
    throw new SuiIntegrationError(
      "WRONG_NETWORK",
      "An explicit Sui Testnet network is required for payouts.",
    );
  }
  return "testnet";
}

export function appMinorToUsdcBaseUnits(amountMinor: number): bigint {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      "App minor units must be a positive safe integer.",
    );
  }
  return BigInt(amountMinor) * USDC_BASE_UNITS_PER_APP_MINOR;
}

export function usdcBaseUnitsToAppMinor(baseUnits: bigint): MinorAmount {
  if (baseUnits <= 0n) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      "USDC base units must be positive.",
    );
  }
  if (baseUnits % USDC_BASE_UNITS_PER_APP_MINOR !== 0n) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      "USDC base units must be exactly divisible by 10,000.",
    );
  }
  const minor = baseUnits / USDC_BASE_UNITS_PER_APP_MINOR;
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new SuiIntegrationError(
      "INVALID_AMOUNT",
      "USDC amount exceeds the app safe-integer range.",
    );
  }
  return asMinorAmount(Number(minor));
}

export function nonnegativeUsdcBaseUnitsToAppMinor(
  baseUnits: bigint,
): MinorAmount {
  return baseUnits === 0n
    ? asMinorAmount(0)
    : usdcBaseUnitsToAppMinor(baseUnits);
}

