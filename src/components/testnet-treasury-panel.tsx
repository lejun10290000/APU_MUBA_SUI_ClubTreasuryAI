"use client";

import {
  useCurrentAccount,
  useCurrentClient,
  useCurrentNetwork,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import type { Transaction } from "@mysten/sui/transactions";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatCoinAmount, parseCoinAmount } from "@/src/lib/sui/amounts";
import {
  isDeploymentReady,
  suiDeploymentConfig,
} from "@/src/lib/sui/deployment";
import {
  executeAndConfirmTestnetTransaction,
  getCreatedTreasuryObjects,
  testnetExplorerTransactionUrl,
  type ConfirmedTransaction,
} from "@/src/lib/sui/execution";
import { SuiIntegrationError } from "@/src/lib/sui/errors";
import {
  availableTestnetActions,
  emptyTestnetDemoState,
  type TestnetDemoState,
  type TestnetDemoStep,
} from "@/src/lib/sui/testnet-state";
import { treasuryTransactionService } from "@/src/lib/sui/transaction-service";
import { isTestnetAccount } from "@/src/lib/sui/wallet-status";
import { ensureWalletIdentity } from "@/src/lib/sui/wallet-identity";
import type {
  PersistedTreasuryWorkspace,
  SuiTreasuryLinkInput,
} from "@/src/lib/treasuries/types";

const STORAGE_KEY = "clubtreasury.testnet-demo.v1";
const CATEGORY = "events";
const stepLabels: Record<TestnetDemoStep, string> = {
  create: "Treasury creation",
  fund: "Deposit",
  allocate: "Allocation",
  payout: "Payout",
};

type CoinMetadata = { decimals: number; symbol: string; name: string };
type CoinRow = { objectId: string; balance: string };

function errorMessage(error: unknown) {
  if (error instanceof SuiIntegrationError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return "The Sui Testnet request did not complete.";
}

function short(value: string) {
  return value ? `${value.slice(0, 10)}…${value.slice(-6)}` : "Not created yet";
}

export function TestnetTreasuryPanel() {
  const searchParams = useSearchParams();
  const dAppKit = useDAppKit();
  const client = useCurrentClient();
  const account = useCurrentAccount();
  const network = useCurrentNetwork();
  const [demo, setDemo] = useState<TestnetDemoState>(emptyTestnetDemoState);
  const [metadata, setMetadata] = useState<CoinMetadata | null>(null);
  const [coins, setCoins] = useState<CoinRow[]>([]);
  const [sourceCoinId, setSourceCoinId] = useState("");
  const [fundAmount, setFundAmount] = useState("1");
  const [payoutAmount, setPayoutAmount] = useState("0.1");
  const [recipient, setRecipient] = useState("");
  const [treasuryJson, setTreasuryJson] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [lastTransaction, setLastTransaction] =
    useState<ConfirmedTransaction | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<PersistedTreasuryWorkspace[]>(
    [],
  );
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [linkTreasuryObjectId, setLinkTreasuryObjectId] = useState("");
  const [linkTreasurerCapObjectId, setLinkTreasurerCapObjectId] = useState("");
  const storageReady = useRef(false);

  const connected = account !== null;
  const onTestnet =
    network === "testnet" &&
    Boolean(account && isTestnetAccount(account.chains));
  const deploymentReady = isDeploymentReady(suiDeploymentConfig);
  const actions = useMemo(() => availableTestnetActions(demo), [demo]);
  const executionReady = connected && onTestnet && deploymentReady;
  const effectiveLinkTreasuryObjectId =
    linkTreasuryObjectId.trim() || demo.treasuryId;
  const effectiveLinkTreasurerCapObjectId =
    linkTreasurerCapObjectId.trim() || demo.treasurerCapId;

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const restored = { ...emptyTestnetDemoState, ...JSON.parse(stored) };
        queueMicrotask(() => {
          storageReady.current = true;
          setDemo(restored);
        });
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        storageReady.current = true;
      }
    } else {
      storageReady.current = true;
    }
  }, []);

  useEffect(() => {
    if (storageReady.current) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    }
  }, [demo]);

  async function loadPersistedWorkspaces() {
    if (!account) return;
    setBusy("workspaces");
    setError(null);
    try {
      await ensureWalletIdentity({
        signer: dAppKit,
        walletAddress: account.address,
        displayName: "Club treasurer",
      });
      const response = await fetch("/api/treasuries");
      const result = (await response.json()) as {
        treasuries?: PersistedTreasuryWorkspace[];
        error?: string;
      };
      if (!response.ok || !result.treasuries) {
        throw new Error(
          result.error ?? "Treasury workspaces could not be loaded.",
        );
      }
      const manageable = result.treasuries.filter(
        (workspace) => workspace.role === "owner",
      );
      setWorkspaces(manageable);
      const requested = searchParams.get("treasury");
      const selected =
        manageable.find((workspace) => workspace.id === requested) ??
        manageable.find((workspace) => !workspace.linkedToSui) ??
        manageable[0];
      setSelectedWorkspaceId(selected?.id ?? "");
      setNotice(
        manageable.length
          ? "Persisted treasury workspaces loaded."
          : "No owner-managed treasury workspace is available to link.",
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  async function linkPersistedWorkspace() {
    if (!account || !selectedWorkspaceId) return;
    setBusy("link");
    setError(null);
    try {
      await ensureWalletIdentity({
        signer: dAppKit,
        walletAddress: account.address,
        displayName: "Club treasurer",
      });
      const body: SuiTreasuryLinkInput = {
        treasuryObjectId: effectiveLinkTreasuryObjectId,
        treasurerCapObjectId: effectiveLinkTreasurerCapObjectId,
      };
      const response = await fetch(
        `/api/treasuries/${selectedWorkspaceId}/link-sui`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json()) as {
        treasury?: PersistedTreasuryWorkspace;
        error?: string;
      };
      if (!response.ok || !result.treasury) {
        throw new Error(
          result.error ?? "The Sui treasury could not be linked.",
        );
      }
      setWorkspaces((current) =>
        current.map((workspace) =>
          workspace.id === result.treasury!.id ? result.treasury! : workspace,
        ),
      );
      setNotice(
        "Sui Treasury and TreasurerCap verified. This workspace is now linked.",
      );
    } catch (caught) {
      setError(errorMessage(caught));
      setNotice(null);
    } finally {
      setBusy(null);
    }
  }

  async function loadTestnetData() {
    if (!account) return;
    setBusy("data");
    setError(null);
    try {
      const [metadataResult, coinResult] = await Promise.all([
        client.getCoinMetadata({ coinType: suiDeploymentConfig.usdcCoinType }),
        client.listCoins({
          owner: account.address,
          coinType: suiDeploymentConfig.usdcCoinType,
          limit: 50,
        }),
      ]);
      if (!metadataResult.coinMetadata) {
        throw new SuiIntegrationError(
          "COIN_METADATA_UNAVAILABLE",
          "Circle USDC metadata was not returned by Sui Testnet.",
          "on-chain",
        );
      }
      setMetadata(metadataResult.coinMetadata);
      setCoins(coinResult.objects);
      setSourceCoinId(
        (current) => current || coinResult.objects[0]?.objectId || "",
      );
      setNotice("Sui Testnet metadata and wallet-owned USDC coins refreshed.");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  async function refreshTreasury() {
    if (!demo.treasuryId) return;
    setBusy("object");
    setError(null);
    try {
      const result = await client.getObject({
        objectId: demo.treasuryId,
        include: { json: true },
      });
      setTreasuryJson(result.object.json);
      setNotice("Treasury state refreshed from Sui Testnet.");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  async function execute(step: TestnetDemoStep, transaction: Transaction) {
    setBusy(step);
    setError(null);
    setNotice("Confirm this single transaction in your wallet.");
    try {
      const confirmed = await executeAndConfirmTestnetTransaction({
        transaction,
        executor: {
          signAndExecuteTransaction: (input) =>
            dAppKit.signAndExecuteTransaction(input),
        },
        client: {
          waitForTransaction: (input) => client.waitForTransaction(input),
        },
        connected,
        network: onTestnet ? "testnet" : network,
      });
      let identifiers: Partial<TestnetDemoState> = {};
      if (step === "create") {
        const packageId = suiDeploymentConfig.packageId!;
        const created = getCreatedTreasuryObjects(confirmed, packageId);
        if (!created.treasuryId || !created.treasurerCapId) {
          throw new SuiIntegrationError(
            "TRANSACTION_CONFIRMATION_FAILED",
            "Creation succeeded, but the Treasury and TreasurerCap IDs could not both be verified.",
            "on-chain",
          );
        }
        identifiers = created;
      }
      setDemo((current) => ({
        ...current,
        ...identifiers,
        digests: { ...current.digests, [step]: confirmed.digest },
      }));
      setLastTransaction(confirmed);
      setNotice(`${stepLabels[step]} confirmed on Sui Testnet.`);
    } catch (caught) {
      setError(errorMessage(caught));
      setNotice(null);
    } finally {
      setBusy(null);
    }
  }

  function amount(value: string) {
    if (!metadata) {
      throw new SuiIntegrationError(
        "COIN_METADATA_UNAVAILABLE",
        "Load Sui Testnet coin metadata before entering transaction amounts.",
        "on-chain",
      );
    }
    return parseCoinAmount(value, metadata.decimals);
  }

  function buildAndExecute(step: TestnetDemoStep) {
    try {
      if (step === "create") {
        void execute(
          step,
          treasuryTransactionService.buildCreateTreasury({
            externalReference: `clubtreasury-demo-${Date.now()}`,
          }),
        );
      } else if (step === "fund") {
        const units = amount(fundAmount);
        const selected = coins.find((coin) => coin.objectId === sourceCoinId);
        if (!selected || BigInt(selected.balance) < units) {
          throw new SuiIntegrationError(
            "INSUFFICIENT_COIN_BALANCE",
            "Select a wallet-owned USDC coin with enough balance.",
            "on-chain",
          );
        }
        void execute(
          step,
          treasuryTransactionService.buildFundTreasury({
            treasuryId: demo.treasuryId,
            sourceCoinId,
            amount: units,
          }),
        );
      } else if (step === "allocate") {
        void execute(
          step,
          treasuryTransactionService.buildConfirmAllocations({
            treasuryId: demo.treasuryId,
            treasurerCapId: demo.treasurerCapId,
            categoryReferences: [CATEGORY],
            allocations: [amount(fundAmount)],
          }),
        );
      } else {
        const payoutRecipient = recipient || account?.address || "";
        void execute(
          step,
          treasuryTransactionService.buildPayout({
            treasuryId: demo.treasuryId,
            treasurerCapId: demo.treasurerCapId,
            categoryReference: CATEGORY,
            recipient: payoutRecipient,
            amount: amount(payoutAmount),
          }),
        );
      }
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  const transactionButton =
    "rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500";

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <section className="space-y-4">
        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Safety and deployment status</h2>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <p className={connected ? "text-emerald-700" : "text-amber-800"}>
              Wallet: {connected ? short(account.address) : "Not connected"}
            </p>
            <p className={onTestnet ? "text-emerald-700" : "text-amber-800"}>
              Network: {onTestnet ? "Sui Testnet" : "Switch to Sui Testnet"}
            </p>
            <p
              className={
                deploymentReady ? "text-emerald-700" : "text-amber-800"
              }
            >
              Package:{" "}
              {deploymentReady
                ? short(suiDeploymentConfig.packageId!)
                : "Not configured"}
            </p>
          </div>
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            Each button below requests exactly one wallet signature. Nothing is
            submitted automatically, and AI never controls these actions.
          </p>
          {!deploymentReady ? (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-amber-900"
            >
              Deployment gate active: transaction buttons remain disabled until
              a verified Sui Testnet package ID is configured.
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                1. Load Sui Testnet USDC data
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Read-only RPC request; no signature.
              </p>
            </div>
            <button
              className={transactionButton}
              disabled={!connected || !onTestnet || busy !== null}
              onClick={loadTestnetData}
              type="button"
            >
              {busy === "data" ? "Loading…" : "Load Sui Testnet data"}
            </button>
          </div>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[var(--muted)]">Coin</dt>
              <dd className="font-semibold">
                {metadata
                  ? `${metadata.name} (${metadata.symbol})`
                  : "Not loaded"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Decimals</dt>
              <dd className="font-semibold">
                {metadata?.decimals ?? "Not loaded"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Owned coin objects</dt>
              <dd className="font-semibold">
                {metadata ? coins.length : "Not loaded"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">2. Create treasury</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Creates a shared Treasury and your address-owned TreasurerCap.
          </p>
          <button
            className={`${transactionButton} mt-4`}
            disabled={!executionReady || !actions.create || busy !== null}
            onClick={() => buildAndExecute("create")}
            type="button"
          >
            Create treasury · sign once
          </button>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">3. Deposit native Testnet USDC</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Source coin
              <select
                aria-label="Source USDC coin"
                className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm"
                onChange={(event) => setSourceCoinId(event.target.value)}
                value={sourceCoinId}
              >
                <option value="">Select a wallet-owned coin</option>
                {coins.map((coin) => (
                  <option key={coin.objectId} value={coin.objectId}>
                    {short(coin.objectId)} ·{" "}
                    {metadata
                      ? formatCoinAmount(coin.balance, metadata.decimals)
                      : coin.balance}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              Deposit amount
              <input
                aria-label="Deposit amount"
                className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm"
                onChange={(event) => setFundAmount(event.target.value)}
                value={fundAmount}
              />
            </label>
          </div>
          <button
            className={`${transactionButton} mt-4`}
            disabled={
              !executionReady ||
              !metadata ||
              !sourceCoinId ||
              !actions.fund ||
              busy !== null
            }
            onClick={() => buildAndExecute("fund")}
            type="button"
          >
            Deposit USDC · sign once
          </button>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">4. Confirm category allocation</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Allocates the full deposited amount to the{" "}
            <strong>{CATEGORY}</strong> category exactly once.
          </p>
          <button
            className={`${transactionButton} mt-4`}
            disabled={
              !executionReady || !metadata || !actions.allocate || busy !== null
            }
            onClick={() => buildAndExecute("allocate")}
            type="button"
          >
            Confirm allocation · sign once
          </button>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">5. Treasurer-approved payout</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Recipient address
              <input
                aria-label="Payout recipient"
                className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm"
                onChange={(event) => setRecipient(event.target.value)}
                value={recipient || account?.address || ""}
              />
            </label>
            <label className="text-xs font-semibold">
              Payout amount
              <input
                aria-label="Payout amount"
                className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm"
                onChange={(event) => setPayoutAmount(event.target.value)}
                value={payoutAmount}
              />
            </label>
          </div>
          <button
            className={`${transactionButton} mt-4`}
            disabled={
              !executionReady ||
              !metadata ||
              !(recipient || account?.address) ||
              !actions.payout ||
              busy !== null
            }
            onClick={() => buildAndExecute("payout")}
            type="button"
          >
            Approve and pay · sign once
          </button>
        </article>

        {notice ? (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {notice}
          </p>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800"
          >
            {error}
          </p>
        ) : null}
      </section>

      <aside className="space-y-4">
        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Link a persisted workspace</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Owner-only verification stores an existing Testnet Treasury link. It
            does not create, fund, allocate, or pay anything.
          </p>
          <button
            className={`${transactionButton} mt-4`}
            disabled={!connected || !onTestnet || busy !== null}
            onClick={loadPersistedWorkspaces}
            type="button"
          >
            {busy === "workspaces" ? "Loading…" : "Load my workspaces"}
          </button>
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold">
              Persisted treasury
              <select
                aria-label="Persisted treasury workspace"
                className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 text-sm"
                onChange={(event) => setSelectedWorkspaceId(event.target.value)}
                value={selectedWorkspaceId}
              >
                <option value="">Select an owner-managed workspace</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name} ·{" "}
                    {workspace.linkedToSui ? "linked" : "not linked"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold">
              Treasury object ID
              <input
                aria-label="Treasury object ID to link"
                className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 font-mono text-xs"
                onChange={(event) =>
                  setLinkTreasuryObjectId(event.target.value)
                }
                value={linkTreasuryObjectId || demo.treasuryId}
              />
            </label>
            <label className="block text-xs font-semibold">
              TreasurerCap object ID
              <input
                aria-label="TreasurerCap object ID to verify"
                className="mt-1 w-full rounded-xl border border-[var(--line)] p-2.5 font-mono text-xs"
                onChange={(event) =>
                  setLinkTreasurerCapObjectId(event.target.value)
                }
                value={linkTreasurerCapObjectId || demo.treasurerCapId}
              />
            </label>
          </div>
          <button
            className={`${transactionButton} mt-4 w-full`}
            disabled={
              !executionReady ||
              !selectedWorkspaceId ||
              !effectiveLinkTreasuryObjectId ||
              !effectiveLinkTreasurerCapObjectId ||
              busy !== null
            }
            onClick={linkPersistedWorkspace}
            type="button"
          >
            {busy === "link"
              ? "Verifying…"
              : "Verify and link to this workspace"}
          </button>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Verified public identifiers</h2>
          <dl className="mt-4 space-y-3 text-xs">
            <div>
              <dt className="text-[var(--muted)]">Treasury object</dt>
              <dd className="break-all font-mono">
                {demo.treasuryId || "Not created yet"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">TreasurerCap object</dt>
              <dd className="break-all font-mono">
                {demo.treasurerCapId || "Not created yet"}
              </dd>
            </div>
          </dl>
          <button
            className="mt-4 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold disabled:opacity-50"
            disabled={!demo.treasuryId || busy !== null}
            onClick={refreshTreasury}
            type="button"
          >
            Refresh treasury object
          </button>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Transaction evidence</h2>
          <ul className="mt-4 space-y-3 text-xs">
            {(
              ["create", "fund", "allocate", "payout"] as TestnetDemoStep[]
            ).map((step) => {
              const digest = demo.digests[step];
              const href = digest
                ? testnetExplorerTransactionUrl(digest)
                : null;
              return (
                <li
                  className="flex items-center justify-between gap-3"
                  key={step}
                >
                  <span>{stepLabels[step]}</span>
                  {href ? (
                    <a
                      className="font-semibold text-[var(--brand)] underline"
                      href={href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View confirmed transaction
                    </a>
                  ) : (
                    <span className="text-[var(--muted)]">Not submitted</span>
                  )}
                </li>
              );
            })}
          </ul>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-lg font-bold">Latest on-chain response</h2>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
            {JSON.stringify(
              treasuryJson ??
                lastTransaction?.events ?? {
                  status: "No verified response yet",
                },
              null,
              2,
            )}
          </pre>
        </article>

        <button
          className="text-xs font-semibold text-rose-700 underline"
          onClick={() => {
            setDemo(emptyTestnetDemoState);
            setTreasuryJson(null);
            setLastTransaction(null);
          }}
          type="button"
        >
          Clear this session’s public demo state
        </button>
      </aside>
    </div>
  );
}
