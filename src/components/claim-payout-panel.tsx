"use client";

import {
  useCurrentAccount,
  useCurrentClient,
  useCurrentNetwork,
  useDAppKit,
} from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import { useRef, useState } from "react";
import { formatUsdcMinor } from "@/src/domain/money";
import type { PersistedClaim } from "@/src/domain/stage5-claims";
import type {
  PaymentAttempt,
  PreparePaymentResult,
} from "@/src/domain/stage6-payments";
import {
  executeApprovedClaimPayout,
  type PaymentReconciliationResult,
  type PayoutClientPhase,
} from "@/src/lib/payments/client-flow";
import { suiConfig } from "@/src/lib/sui/config";
import {
  requirePackageId,
  suiDeploymentConfig,
} from "@/src/lib/sui/deployment";
import { testnetExplorerTransactionUrl } from "@/src/lib/sui/execution";
import {
  appMinorToUsdcBaseUnits,
  assertSuiTestnet,
} from "@/src/lib/sui/payment-safety";
import { treasuryTransactionService } from "@/src/lib/sui/transaction-service";
import { verifyTreasurerCap } from "@/src/lib/sui/treasurer-cap-verification";

export function ClaimPayoutPanel({
  claim,
  onClaimUpdated,
}: {
  claim: PersistedClaim;
  onClaimUpdated(claim: PersistedClaim): void;
}) {
  const account = useCurrentAccount();
  const client = useCurrentClient();
  const network = useCurrentNetwork();
  const dAppKit = useDAppKit();
  const [phase, setPhase] = useState<PayoutClientPhase>(
    claim.status === "paid" ? "paid" : "ready",
  );
  const [error, setError] = useState<string | null>(null);
  const actionInFlight = useRef(false);

  async function act() {
    if (actionInFlight.current) return;
    if (!account) {
      setError("Connect the authorized treasurer wallet before paying.");
      return;
    }
    actionInFlight.current = true;
    try {
      assertSuiTestnet(network);
      if (!account.chains.some((chain) => chain === "sui:testnet")) {
        throw new Error(
          "The connected wallet is not authorized for Sui Testnet.",
        );
      }
      const packageId = requirePackageId(suiDeploymentConfig);
      const capObjectId = suiConfig.treasurerCapObjectId;
      if (!capObjectId) {
        throw new Error(
          "The Stage 6 TreasurerCap object ID is not configured.",
        );
      }
      setError(null);
      const result = await executeApprovedClaimPayout(claim.id, {
        prepare: (claimId) =>
          requestJson<PreparePaymentResult>(
            `/api/claims/${claimId}/payment/prepare`,
          ),
        authorize: async (snapshot) => {
          await verifyTreasurerCap(client, {
            capObjectId,
            connectedWalletAddress: account.address,
            approvedTreasuryObjectId: snapshot.treasuryObjectId,
            packageId,
            coinType: suiConfig.usdcCoinType,
          });
          return { treasurerCapObjectId: capObjectId };
        },
        build: (snapshot) =>
          treasuryTransactionService.buildPayout({
            treasuryId: snapshot.treasuryObjectId,
            treasurerCapId: capObjectId,
            categoryReference: snapshot.categoryReference,
            recipient: snapshot.recipientSuiAddress,
            amount: appMinorToUsdcBaseUnits(snapshot.amountMinor),
          }),
        sign: (transaction) => dAppKit.signTransaction({ transaction }),
        deriveDigest: async (bytes) => Transaction.from(bytes).getDigest(),
        persistSignedSubmission: (attemptId, evidence) =>
          requestJson<{ attempt: PaymentAttempt }>(
            `/api/payments/${attemptId}/submit`,
            evidence,
          ).then((response) => response.attempt),
        broadcast: ({ bytes, signature }) =>
          client.executeTransaction({
            transaction: fromBase64(bytes),
            signatures: [signature],
          }),
        reconcile: (attemptId) =>
          requestJson<PaymentReconciliationResult>(
            `/api/payments/${attemptId}/reconcile`,
          ),
        onPhase: setPhase,
      });
      if (result.state === "confirmed") {
        const paidClaim = result.claim as PersistedClaim;
        setPhase("paid");
        onClaimUpdated(paidClaim);
      } else if (result.state === "reconciliation_required") {
        setPhase("reconciliation_required");
      } else {
        setPhase("failed");
        setError("Sui reported that this payout transaction failed.");
      }
    } catch (caught) {
      setPhase("failed");
      setError(
        caught instanceof Error
          ? caught.message
          : "The payout could not be completed.",
      );
    } finally {
      actionInFlight.current = false;
    }
  }

  return (
    <ClaimPayoutView claim={claim} error={error} onAction={act} phase={phase} />
  );
}

export function ClaimPayoutView({
  claim,
  phase,
  error = null,
  onAction,
}: {
  claim: PersistedClaim;
  phase: PayoutClientPhase;
  error?: string | null;
  onAction(): void;
}) {
  const eligible =
    claim.status === "approved_unpaid" && claim.paymentStatus === "unpaid";
  const paid = claim.status === "paid" && claim.paymentStatus === "paid";
  if (!eligible && !paid) return null;

  const snapshot = claim.approvedSnapshot;
  const busy = [
    "preparing",
    "awaiting_signature",
    "submitting",
    "confirming",
  ].includes(phase);
  const digestUrl = claim.confirmedTransactionDigest
    ? testnetExplorerTransactionUrl(claim.confirmedTransactionDigest)
    : null;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
            Stage 6 · Sui Testnet payout
          </p>
          <h3 className="mt-2 text-lg font-bold text-emerald-950">
            {paid ? "Paid" : phaseLabel(phase)}
          </h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-800">
          Human signed
        </span>
      </div>

      {snapshot && (
        <dl className="mt-4 space-y-3 text-xs text-emerald-950/70">
          <PayoutField
            label="Amount"
            value={formatUsdcMinor(snapshot.amountMinor)}
          />
          <PayoutField label="Category" value={snapshot.categoryReference} />
          <PayoutField
            label="Treasury"
            value={snapshot.treasuryObjectId}
            mono
          />
          <PayoutField
            label="Recipient"
            value={snapshot.recipientSuiAddress}
            mono
          />
        </dl>
      )}

      {paid && claim.paidAt && (
        <p className="mt-4 text-xs text-emerald-950/70">
          Confirmed {new Date(claim.paidAt).toLocaleString()}
        </p>
      )}
      {paid && claim.confirmedTransactionDigest && (
        <p className="mt-3 break-all font-mono text-[11px] text-emerald-950/70">
          {claim.confirmedTransactionDigest}
        </p>
      )}
      {paid && digestUrl && (
        <a
          className="mt-4 inline-flex rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-emerald-800"
          href={digestUrl}
          rel="noreferrer"
          target="_blank"
        >
          View on Sui Testnet explorer
        </a>
      )}

      {error && (
        <p
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {eligible && (
        <button
          className="mt-5 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={busy}
          onClick={onAction}
          type="button"
        >
          {phase === "reconciliation_required"
            ? "Reconcile existing transaction"
            : busy
              ? phaseLabel(phase)
              : "Pay approved claim"}
        </button>
      )}
      {eligible && (
        <p className="mt-3 text-xs leading-5 text-emerald-950/65">
          The wallet must show and approve this exact Testnet USDC payout. The
          claim stays unpaid until its PayoutEvent is confirmed.
        </p>
      )}
    </section>
  );
}

function phaseLabel(phase: PayoutClientPhase) {
  switch (phase) {
    case "preparing":
      return "Preparing immutable payout";
    case "awaiting_signature":
      return "Awaiting wallet signature";
    case "submitting":
      return "Saving signed transaction";
    case "confirming":
      return "Confirming on Sui Testnet";
    case "reconciliation_required":
      return "Reconciliation required";
    case "failed":
      return "Payment not completed";
    case "paid":
      return "Paid";
    default:
      return "Ready";
  }
}

function PayoutField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="font-bold text-emerald-900">{label}</dt>
      <dd className={`mt-1 break-all ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

async function requestJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Payment request failed.");
  return result;
}
