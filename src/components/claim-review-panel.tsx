"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { compareReceiptAmount } from "@/src/domain/claim-rules";
import { formatUsdcMinor } from "@/src/domain/money";
import type { PersistedClaim } from "@/src/domain/stage5-claims";
import { receiptAnalysisSchema } from "@/src/lib/ai/types";
import { Icon } from "./icon";

const recommendationStyles = {
  approve: "border-emerald-200 bg-emerald-50 text-emerald-800",
  review: "border-amber-200 bg-amber-50 text-amber-800",
  reject: "border-rose-200 bg-rose-50 text-rose-800",
} as const;

export function ClaimReviewPanel() {
  const searchParams = useSearchParams();
  const claimId = searchParams.get("claim");
  const [claim, setClaim] = useState<PersistedClaim | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busyDecision, setBusyDecision] = useState<"approve" | "reject" | null>(
    null,
  );
  const [decisionReason, setDecisionReason] = useState("");

  useEffect(() => {
    if (!claimId) return;
    let active = true;
    fetch(`/api/claims/${claimId}`)
      .then(async (response) => {
        const result = (await response.json()) as {
          claim?: PersistedClaim;
          receiptPreviewUrl?: string | null;
          error?: string;
        };
        if (!response.ok || !result.claim) {
          throw new Error(result.error ?? "The claim could not be loaded.");
        }
        if (active) {
          setClaim(result.claim);
          setReceiptPreviewUrl(result.receiptPreviewUrl ?? null);
        }
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "The claim could not be loaded.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [claimId]);

  const receiptCheck = useMemo(
    () =>
      claim
        ? compareReceiptAmount(
            claim.requestedAmountMinor,
            claim.receiptAmountMinor,
          )
        : null,
    [claim],
  );

  async function decide(decision: "approve" | "reject") {
    if (!claim) return;
    if (!decisionReason.trim()) {
      setError("Add a short decision note before saving the decision.");
      return;
    }
    setBusyDecision(decision);
    setError(null);
    try {
      const response = await fetch(`/api/claims/${claim.id}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, reason: decisionReason }),
      });
      const result = (await response.json()) as {
        claim?: PersistedClaim;
        error?: string;
      };
      if (!response.ok || !result.claim) {
        throw new Error(result.error ?? "The decision could not be saved.");
      }
      setClaim(result.claim);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The decision could not be saved.",
      );
    } finally {
      setBusyDecision(null);
    }
  }

  if (!claimId) {
    return (
      <EmptyState message="Submit a claim first, then return here to review its stored recommendation." />
    );
  }
  if (error && !claim) {
    return <EmptyState message={error} />;
  }
  if (!claim || !receiptCheck) {
    return (
      <p className="rounded-2xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
        Loading the persisted claim…
      </p>
    );
  }

  const decisionComplete =
    claim.status === "approved_unpaid" || claim.status === "rejected";
  const parsedAnalysis = receiptAnalysisSchema.safeParse(claim.receiptAnalysis);
  const aiAnalysis = parsedAnalysis.success ? parsedAnalysis.data : null;
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(24,49,43,0.05)] sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
              <Icon className="size-5" name="receipt" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-violet-700">
                Persisted claim
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
                {claim.merchant}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {claim.submitterName} · {claim.description}
              </p>
            </div>
          </div>
          {claim.recommendation && (
            <span
              className={`w-fit rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${recommendationStyles[claim.recommendation]}`}
            >
              Recommendation · {claim.recommendation}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Requested"
            value={formatUsdcMinor(claim.requestedAmountMinor)}
          />
          <Metric
            label="Receipt"
            value={
              claim.receiptAmountMinor
                ? formatUsdcMinor(claim.receiptAmountMinor)
                : "Missing"
            }
          />
          <Metric label="Category" value={claim.categoryName} />
          <Metric label="Payment" value="Unpaid" />
        </div>

        <div className="mt-7">
          <h3 className="text-sm font-bold">Stored validation results</h3>
          <div className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
            <RuleRow
              label="Receipt amount"
              passed={receiptCheck.matches}
              value={
                receiptCheck.matches
                  ? "Exact amount match"
                  : receiptCheck.status.replaceAll("_", " ")
              }
            />
            <RuleRow
              label="Exact duplicate"
              passed={claim.duplicateMatch.exactIds.length === 0}
              value={
                claim.duplicateMatch.exactIds.length
                  ? "Receipt bytes or reference already used"
                  : "No exact match"
              }
            />
            <RuleRow
              label="Similar duplicate"
              passed={claim.duplicateMatch.similarIds.length === 0}
              value={
                claim.duplicateMatch.similarIds.length
                  ? "Same merchant and amount found"
                  : "No similar match"
              }
            />
            <RuleRow
              label="Receipt evidence"
              passed
              value={`${claim.receiptMimeType} · ${(claim.receiptSizeBytes / 1024).toFixed(1)} KB · SHA-256 ${claim.receiptHash.slice(0, 12)}…`}
            />
            {aiAnalysis && (
              <RuleRow
                label="AI category suggestion"
                passed={categoryMatches(
                  aiAnalysis.categorySuggestion,
                  claim.categoryName,
                  claim.categoryExternalReference,
                )}
                value={aiAnalysis.categorySuggestion ?? "No category suggested"}
              />
            )}
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-violet-200 bg-violet-50/70 p-5">
          <h3 className="text-sm font-bold text-violet-950">
            Stored AI receipt extraction
          </h3>
          {aiAnalysis ? (
            <>
              <dl className="mt-4 grid gap-3 text-xs text-violet-950/70 sm:grid-cols-2">
                <Snapshot
                  label="Merchant"
                  value={aiAnalysis.merchant ?? "Missing"}
                />
                <Snapshot
                  label="Amount"
                  value={
                    aiAnalysis.amountMinor === null
                      ? "Missing"
                      : formatUsdcMinor(aiAnalysis.amountMinor)
                  }
                />
                <Snapshot
                  label="Receipt date"
                  value={aiAnalysis.receiptDate ?? "Missing"}
                />
                <Snapshot
                  label="Suggested category"
                  value={aiAnalysis.categorySuggestion ?? "Missing"}
                />
              </dl>
              <ul className="mt-4 space-y-1 text-xs leading-5 text-violet-950/70">
                {aiAnalysis.reasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
                {aiAnalysis.missingFields.length > 0 && (
                  <li>
                    • Missing fields: {aiAnalysis.missingFields.join(", ")}
                  </li>
                )}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-violet-950/70">
              {analysisFailureMessage(claim.receiptAnalysis)}
            </p>
          )}
        </div>

        <div className="mt-7 rounded-2xl bg-slate-50 p-5">
          <h3 className="text-sm font-bold">Why this recommendation?</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
            {claim.recommendationReasons.map((reason) => (
              <li className="flex gap-2" key={reason}>
                <span aria-hidden="true" className="text-[var(--brand)]">
                  •
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {receiptPreviewUrl && (
          <a
            className="mt-5 inline-flex rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--brand)]"
            href={receiptPreviewUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open private receipt preview
          </a>
        )}

        {error && (
          <p
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            role="alert"
          >
            {error}
          </p>
        )}

        {!decisionComplete && (
          <div className="mt-6">
            <label className="text-sm font-bold" htmlFor="decisionReason">
              Human decision note
            </label>
            <p className="mt-1 text-xs text-[var(--muted)]">
              This note is persisted with the treasurer&apos;s Approve or Reject
              action.
            </p>
            <textarea
              className="mt-2 min-h-20 w-full resize-y rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-emerald-100"
              id="decisionReason"
              maxLength={240}
              onChange={(event) => setDecisionReason(event.target.value)}
              placeholder="e.g. Receipt and category evidence verified."
              value={decisionReason}
            />
          </div>
        )}

        {decisionComplete && claim.decisionReason && (
          <p className="mt-6 rounded-xl border border-[var(--line)] bg-slate-50 px-4 py-3 text-sm text-[var(--muted)]">
            <strong className="text-[var(--ink)]">Decision note:</strong>{" "}
            {claim.decisionReason}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="rounded-xl px-4 py-3 text-center text-sm font-bold text-[var(--muted)]"
            href="/dashboard/claims/new"
          >
            Submit another claim
          </Link>
          {decisionComplete ? (
            <span className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              Decision saved · {claim.status.replaceAll("_", " ")}
            </span>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 disabled:opacity-50"
                disabled={busyDecision !== null || !decisionReason.trim()}
                onClick={() => decide("reject")}
                type="button"
              >
                {busyDecision === "reject" ? "Saving…" : "Reject claim"}
              </button>
              <button
                className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                disabled={busyDecision !== null || !decisionReason.trim()}
                onClick={() => decide("approve")}
                type="button"
              >
                {busyDecision === "approve"
                  ? "Saving…"
                  : "Approve · keep unpaid"}
              </button>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-3xl bg-[var(--brand-deep)] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/55">
            Human decision boundary
          </p>
          <h3 className="mt-3 text-xl font-bold">No payment in Stage 5</h3>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Approval only writes an immutable payout snapshot for Stage 6. It
            does not open a wallet, sign a transaction, or move USDC.
          </p>
        </section>
        {claim.approvedSnapshot && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
              Approved payout snapshot
            </p>
            <dl className="mt-4 space-y-3 text-xs text-emerald-950/70">
              <Snapshot
                label="Amount"
                value={formatUsdcMinor(claim.approvedSnapshot.amountMinor)}
              />
              <Snapshot
                label="Category"
                value={claim.approvedSnapshot.categoryReference}
              />
              <Snapshot
                label="Recipient"
                value={claim.approvedSnapshot.recipientSuiAddress}
                mono
              />
            </dl>
          </section>
        )}
      </aside>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <section className="rounded-3xl border border-[var(--line)] bg-white p-8">
      <h2 className="text-xl font-bold">No reviewable claim</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
      <Link
        className="mt-5 inline-flex rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white"
        href="/dashboard/claims/new"
      >
        Submit a claim
      </Link>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function RuleRow({
  label,
  passed,
  value,
}: {
  label: string;
  passed: boolean;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <span
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
      >
        {passed ? "✓" : "!"}
      </span>
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{value}</p>
      </div>
    </div>
  );
}

function categoryMatches(
  suggestion: string | null,
  categoryName: string,
  categoryReference: string,
): boolean {
  const normalized = normalizeCategory(suggestion);
  return (
    normalized.length > 0 &&
    [categoryName, categoryReference]
      .map(normalizeCategory)
      .includes(normalized)
  );
}

function normalizeCategory(value: string | null): string {
  return value?.trim().toLocaleLowerCase("en").replace(/\s+/g, " ") ?? "";
}

function analysisFailureMessage(value: unknown): string {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return `AI analysis did not complete: ${message}`;
    }
  }
  return "AI extraction is unavailable. The claim remains on the manual Review path.";
}

function Snapshot({
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
