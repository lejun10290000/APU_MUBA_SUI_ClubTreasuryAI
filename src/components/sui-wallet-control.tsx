"use client";

import {
  useCurrentAccount,
  useCurrentNetwork,
  useCurrentWallet,
  useDAppKit,
  useWalletConnection,
  useWallets,
} from "@mysten/dapp-kit-react";
import { useState } from "react";
import {
  isDeploymentReady,
  suiDeploymentConfig,
} from "@/src/lib/sui/deployment";
import {
  getWalletErrorMessage,
  isTestnetAccount,
} from "@/src/lib/sui/wallet-status";
import { WalletConnectionLabel } from "./wallet-connection-label";

export function SuiWalletControl() {
  const dAppKit = useDAppKit();
  const wallets = useWallets();
  const connection = useWalletConnection();
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();
  const network = useCurrentNetwork();
  const [error, setError] = useState<string | null>(null);

  const busy = connection.isConnecting || connection.isReconnecting;
  const correctNetwork =
    network === "testnet" &&
    account !== null &&
    isTestnetAccount(account.chains);

  async function connect(walletIndex: number) {
    setError(null);
    try {
      await dAppKit.connectWallet({ wallet: wallets[walletIndex] });
    } catch (caught) {
      setError(getWalletErrorMessage(caught));
    }
  }

  async function disconnect() {
    setError(null);
    try {
      await dAppKit.disconnectWallet();
    } catch (caught) {
      setError(getWalletErrorMessage(caught));
    }
  }

  if (connection.isConnected && account) {
    return (
      <details className="relative" data-testid="wallet-control">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold shadow-sm">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${correctNetwork ? "bg-emerald-500" : "bg-amber-500"}`}
          />
          <WalletConnectionLabel
            address={account.address}
            onTestnet={correctNetwork}
            status="connected"
          />
        </summary>
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {wallet?.name ?? "Sui wallet"}
          </p>
          <p className="mt-1 break-all text-sm font-semibold">
            {account.address}
          </p>
          {correctNetwork ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Connected to Sui Testnet.
            </p>
          ) : (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              Switch this wallet account to Sui Testnet before continuing.
            </p>
          )}
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            {isDeploymentReady(suiDeploymentConfig)
              ? "Contract package configured. Transaction controls remain locked until a supported form requests an explicit signature."
              : "Contract package not deployed. Transaction controls are safely disabled."}
          </p>
          <button
            className="mt-3 w-full rounded-xl bg-[var(--brand-deep)] px-3 py-2 text-sm font-semibold text-white"
            onClick={disconnect}
            type="button"
          >
            Disconnect wallet
          </button>
          {error ? (
            <p role="alert" className="mt-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      </details>
    );
  }

  return (
    <details className="relative" data-testid="wallet-control">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm">
        <span aria-hidden="true" className="size-2 rounded-full bg-white/70" />
        <WalletConnectionLabel status={busy ? "connecting" : "disconnected"} />
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[var(--line)] bg-white p-4 text-[var(--ink)] shadow-xl">
        <p className="text-sm font-semibold">Connect on Sui Testnet</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          Connection is always explicit. ClubTreasury AI never asks for your
          recovery phrase or private key.
        </p>
        {wallets.length === 0 ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
            No compatible Sui wallet was detected. Install or enable a Wallet
            Standard compatible Sui wallet, then refresh.
          </p>
        ) : (
          <div className="mt-3 grid gap-2">
            {wallets.map((availableWallet, index) => (
              <button
                className="rounded-xl border border-[var(--line)] px-3 py-2 text-left text-sm font-semibold hover:border-[var(--brand)] disabled:cursor-wait disabled:opacity-60"
                disabled={busy}
                key={`${availableWallet.name}-${index}`}
                onClick={() => connect(index)}
                type="button"
              >
                {availableWallet.name}
              </button>
            ))}
          </div>
        )}
        <button
          className="mt-3 w-full cursor-not-allowed rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500"
          disabled
          type="button"
        >
          Treasury transactions unavailable
        </button>
        {error ? (
          <p role="alert" className="mt-2 text-xs text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </details>
  );
}
