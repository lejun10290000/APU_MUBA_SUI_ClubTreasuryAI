import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { isValidPersonalMessageSignature } from "@mysten/sui/verify";

const suiTestnetGraphQLClient = new SuiGraphQLClient({
  network: "testnet",
  url: "https://graphql.testnet.sui.io/graphql",
});

export async function isValidWalletPersonalMessageSignature({
  message,
  signature,
  walletAddress,
}: {
  message: Uint8Array;
  signature: string;
  walletAddress: string;
}): Promise<boolean> {
  return isValidPersonalMessageSignature(message, signature, {
    address: walletAddress,
    client: suiTestnetGraphQLClient,
  });
}
