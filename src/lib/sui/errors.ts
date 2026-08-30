export type SuiIntegrationErrorCode =
  | "WALLET_NOT_CONNECTED"
  | "WRONG_NETWORK"
  | "DEPLOYMENT_NOT_READY"
  | "INVALID_PACKAGE_ID"
  | "INVALID_OBJECT_ID"
  | "INVALID_RECIPIENT"
  | "INVALID_AMOUNT"
  | "EMPTY_REFERENCE"
  | "DUPLICATE_CATEGORY_REFERENCE"
  | "TRANSACTION_BUILD_FAILED"
  | "TRANSACTION_REJECTED"
  | "TRANSACTION_EXECUTION_FAILED"
  | "TRANSACTION_CONFIRMATION_FAILED"
  | "COIN_METADATA_UNAVAILABLE"
  | "INSUFFICIENT_COIN_BALANCE";

export type SuiIntegrationErrorSource = "build" | "wallet" | "on-chain";

export class SuiIntegrationError extends Error {
  readonly code: SuiIntegrationErrorCode;
  readonly source: SuiIntegrationErrorSource;

  constructor(
    code: SuiIntegrationErrorCode,
    message: string,
    source: SuiIntegrationErrorSource = "build",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "SuiIntegrationError";
    this.code = code;
    this.source = source;
  }
}

export function assertWalletCanSign({
  connected,
  network,
}: {
  connected: boolean;
  network: string | null;
}) {
  if (!connected) {
    throw new SuiIntegrationError(
      "WALLET_NOT_CONNECTED",
      "Connect a Sui wallet before requesting a signature.",
      "wallet",
    );
  }
  if (network !== "testnet") {
    throw new SuiIntegrationError(
      "WRONG_NETWORK",
      "Switch the connected wallet to Sui Testnet.",
      "wallet",
    );
  }
}
