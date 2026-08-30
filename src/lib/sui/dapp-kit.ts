import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import type { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import { SuiIntegrationError } from "./errors";
import { suiConfig } from "./config";

const baseDAppKit = createDAppKit({
  networks: ["testnet"],
  defaultNetwork: "testnet",
  autoConnect: false,
  slushWalletConfig: null,
  createClient: (network) =>
    new SuiGrpcClient({ network, baseUrl: suiConfig.rpcUrl }),
});

export const dAppKit = Object.assign(baseDAppKit, {
  async signAndExecuteTransaction({
    transaction,
    signal,
  }: {
    transaction: Transaction | string;
    signal?: AbortSignal;
  }) {
    // Keep the browser wallet as the human approval/signing boundary, but submit
    // the signed bytes through the app's configured Testnet gRPC client. This
    // avoids depending on a wallet extension's internal RPC execution path while
    // preserving an explicit wallet confirmation for every transaction.
    const signed = await baseDAppKit.signTransaction({ transaction, signal });

    try {
      return await baseDAppKit.getClient("testnet").executeTransaction({
        transaction: fromBase64(signed.bytes),
        signatures: [signed.signature],
      });
    } catch (cause) {
      throw new SuiIntegrationError(
        "TRANSACTION_EXECUTION_FAILED",
        "The wallet signed the transaction, but Sui Testnet execution did not complete.",
        "on-chain",
        { cause },
      );
    }
  },
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
