export const SUI_TESTNET_CHAIN = "sui:testnet";

export function shortenSuiAddress(address: string) {
  if (address.length <= 13) return address;
  return `${address.slice(0, 7)}…${address.slice(-5)}`;
}

export function isTestnetAccount(chains: readonly string[]) {
  return chains.includes(SUI_TESTNET_CHAIN);
}

export function isTreasuryTransactionReady({
  connected,
  onTestnet,
  packageId,
}: {
  connected: boolean;
  onTestnet: boolean;
  packageId: string | null;
}) {
  return connected && onTestnet && packageId !== null;
}

export function getWalletErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "The wallet request did not complete. Please try again.";
}
