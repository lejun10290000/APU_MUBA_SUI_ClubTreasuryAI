"use client";

import {
  useCurrentAccount,
  useCurrentClient,
  useCurrentNetwork,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64, normalizeSuiAddress } from "@mysten/sui/utils";
import { useState } from "react";

import { asMinorAmount, formatUsdcMinor } from "@/src/domain/money";
import {
  buildActivationAllocationTransaction,
  buildActivationCreateTransaction,
  buildActivationFundTransaction,
} from "@/src/lib/sui/activation-transactions";
import { suiDeploymentConfig } from "@/src/lib/sui/deployment";
import { appMinorToUsdcBaseUnits } from "@/src/lib/sui/payment-safety";
import { selectUsdcCoins } from "@/src/lib/sui/usdc-coin-selection";
import { ensureWalletIdentity } from "@/src/lib/sui/wallet-identity";
import type {
  ActivationStep,
  TreasurySuiActivation,
} from "@/src/lib/treasuries/activation-types";
import { nextActivationStep } from "@/src/lib/treasuries/activation-repository";
import type { PersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";

export function TreasuryActivationPanel({
  workspace,
}: {
  workspace: PersistedTreasuryWorkspace;
}) {
  const account = useCurrentAccount();
  const network = useCurrentNetwork();
  const client = useCurrentClient();
  const dAppKit = useDAppKit();
  const [activation, setActivation] = useState(workspace.activation);
  const [joinCode, setJoinCode] = useState(workspace.joinCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableAtomic, setAvailableAtomic] = useState<bigint | null>(null);

  const wrongWallet = Boolean(
    activation &&
      account &&
      normalizeSuiAddress(account.address) !==
        normalizeSuiAddress(activation.ownerWalletAddress),
  );

  async function refreshWorkspace() {
    const response = await fetch("/api/treasuries", { cache: "no-store" });
    const result = (await response.json()) as {
      treasuries?: PersistedTreasuryWorkspace[];
    };
    const current = result.treasuries?.find((item) => item.id === workspace.id);
    if (current) {
      setActivation(current.activation);
      setJoinCode(current.joinCode);
    }
  }

  async function start() {
    if (!account) {
      throw new Error("Connect the verified treasury owner wallet first.");
    }
    await ensureWalletIdentity({
      signer: dAppKit,
      walletAddress: account.address,
      displayName: "Club treasurer",
    });
    const result = await requestJson<{ activation: TreasurySuiActivation }>(
      `/api/treasuries/${workspace.id}/activation`,
      {},
    );
    setActivation(result.activation);
  }

  function reconciliationStep(current: TreasurySuiActivation): ActivationStep {
    if (current.createStatus !== "confirmed") return "create";
    if (current.fundStatus !== "confirmed") return "fund";
    return "allocation";
  }

  async function reconcile(step: ActivationStep) {
    const response = await fetch(
      `/api/treasuries/${workspace.id}/activation/reconcile`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step }),
      },
    );
    const result = (await response.json()) as {
      activation?: TreasurySuiActivation;
      error?: string;
    };
    if (result.activation) setActivation(result.activation);
    if (!response.ok) {
      throw new Error(
        result.error ?? "The saved transaction is not confirmed yet.",
      );
    }
    await refreshWorkspace();
  }

  async function signBroadcastAndReconcile(
    step: ActivationStep,
    transaction: Transaction,
  ) {
    const signed = await dAppKit.signTransaction({ transaction });
    const digest = await Transaction.from(signed.bytes).getDigest();
    await requestJson(
      `/api/treasuries/${workspace.id}/activation/signed`,
      { step, digest },
    );
    try {
      await client.executeTransaction({
        transaction: fromBase64(signed.bytes),
        signatures: [signed.signature],
      });
    } catch {
      await reconcile(step);
      return;
    }
    await reconcile(step);
  }

  async function executeNext() {
    if (!activation) return start();
    if (!account) {
      throw new Error("Connect the verified treasury owner wallet first.");
    }
    if (network !== "testnet" || !account.chains.includes("sui:testnet")) {
      throw new Error("Switch the connected wallet to Sui Testnet.");
    }
    if (wrongWallet) {
      throw new Error("Connect the verified owner wallet for this treasury.");
    }
    const next = nextActivationStep(activation);
    if (next === "complete") return;
    if (next === "reconcile") {
      return reconcile(reconciliationStep(activation));
    }

    let transaction: Transaction;
    if (next === "create") {
      transaction = buildActivationCreateTransaction(suiDeploymentConfig, {
        externalReference: workspace.externalReference,
      });
    } else if (next === "fund") {
      if (!activation.treasuryObjectId) {
        throw new Error("Verified Treasury ID is missing.");
      }
      const coins: Array<{ coinObjectId: string; balance: string }> = [];
      let cursor: string | null = null;
      do {
        const page = await client.listCoins({
          owner: account.address,
          coinType: suiDeploymentConfig.usdcCoinType,
          cursor,
          limit: 50,
        });
        coins.push(
          ...page.objects.map((coin) => ({
            coinObjectId: coin.objectId,
            balance: coin.balance,
          })),
        );
        cursor = page.hasNextPage ? page.cursor : null;
      } while (cursor);
      const required = appMinorToUsdcBaseUnits(workspace.totalBudgetMinor);
      const selected = selectUsdcCoins(coins, required);
      setAvailableAtomic(selected.totalAvailable);
      transaction = buildActivationFundTransaction(suiDeploymentConfig, {
        treasuryId: activation.treasuryObjectId,
        sourceCoinIds: selected.selectedIds,
        amountAtomic: required,
      });
    } else {
      if (!activation.treasuryObjectId || !activation.treasurerCapObjectId) {
        throw new Error("Verified Treasury and TreasurerCap IDs are missing.");
      }
      transaction = buildActivationAllocationTransaction(suiDeploymentConfig, {
        treasuryId: activation.treasuryObjectId,
        treasurerCapId: activation.treasurerCapObjectId,
        categoryReferences: workspace.categories.map(
          (category) => category.externalReference,
        ),
        allocations: workspace.categories.map((category) =>
          appMinorToUsdcBaseUnits(category.allocatedMinor),
        ),
      });
    }
    await signBroadcastAndReconcile(next, transaction);
  }

  async function act(action: "start" | "next") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "start") await start();
      else await executeNext();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Sui activation did not complete.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      <TreasuryActivationView
        activation={activation}
        availableAtomic={availableAtomic}
        busy={busy}
        error={error}
        joinCode={joinCode}
        onAction={(action) => void act(action === "start" ? "start" : "next")}
        requiredMinor={workspace.totalBudgetMinor}
        wrongWallet={wrongWallet}
      />
    </div>
  );
}

export function TreasuryActivationView({
  activation,
  busy,
  wrongWallet = false,
  joinCode,
  error,
  requiredMinor,
  availableAtomic,
  onAction,
}: {
  activation: TreasurySuiActivation | null;
  busy: boolean;
  wrongWallet?: boolean;
  joinCode?: string;
  error?: string | null;
  requiredMinor?: number;
  availableAtomic?: bigint | null;
  onAction(action: "start" | "next"): void;
}) {
  if (activation?.status === "active") {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
          Sui Active
        </p>
        <p className="mt-2 break-all font-mono text-xs text-emerald-950">
          {activation.treasuryObjectId}
        </p>
        <p className="mt-3 text-sm font-semibold text-emerald-950">
          Budget and categories locked
        </p>
        {joinCode && (
          <p className="mt-3 font-mono text-lg font-bold text-emerald-900">
            {joinCode}
          </p>
        )}
      </section>
    );
  }
  if (wrongWallet) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-950">
        Connect the verified owner wallet for this treasury before signing.
      </section>
    );
  }
  const next = activation ? nextActivationStep(activation) : null;
  const reconcile = next === "reconcile";
  const label = !activation
    ? "Activate on Sui"
    : reconcile
      ? "Check existing transaction"
      : next === "create"
        ? "Create Treasury and Cap"
        : next === "fund"
          ? "Fund exact budget"
          : "Confirm dynamic allocations";
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand)]">
        Sui Testnet activation
      </p>
      <h3 className="mt-2 text-lg font-bold">
        Three human wallet confirmations
      </h3>
      {requiredMinor !== undefined && (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Required: {formatUsdcMinor(asMinorAmount(requiredMinor))}
        </p>
      )}
      {availableAtomic !== null && availableAtomic !== undefined && (
        <p className="mt-1 text-sm text-[var(--muted)]">
          Available: {(availableAtomic / 10_000n).toString()} app minor units
        </p>
      )}
      {error && (
        <p
          className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="mt-4 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        disabled={busy}
        onClick={() => onAction(activation ? "next" : "start")}
        type="button"
      >
        {busy ? "Working…" : label}
      </button>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        {reconcile
          ? "A digest already exists. This checks that exact transaction and never requests a replacement signature."
          : "AI cannot authorize or sign. Each blockchain step requires your wallet confirmation."}
      </p>
    </section>
  );
}

async function requestJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? "Activation request failed.");
  }
  return result;
}
