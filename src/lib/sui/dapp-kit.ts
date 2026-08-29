import { createDAppKit } from "@mysten/dapp-kit-react";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { suiConfig } from "./config";

export const dAppKit = createDAppKit({
  networks: ["testnet"],
  defaultNetwork: "testnet",
  autoConnect: false,
  slushWalletConfig: null,
  createClient: (network) =>
    new SuiGrpcClient({ network, baseUrl: suiConfig.rpcUrl }),
});

declare module "@mysten/dapp-kit-react" {
  interface Register {
    dAppKit: typeof dAppKit;
  }
}
