"use client";

import Link from "next/link";
import { Icon } from "./icon";
import { useDemoSessionValue } from "./use-demo-session";
import {
  demoClaimRecordSchema,
  demoClaimStorageKey,
  demoDecisionSchema,
  demoDecisionStorageKey,
} from "@/src/domain/demo-workflow";
import { formatUsdcMinor } from "@/src/domain/money";
import { demoActivity } from "@/src/data/mock-dashboard";
import { verifiedDemoEvidence } from "@/src/data/verified-demo";

export function HistoryPanel() {
  const decision = useDemoSessionValue(
    demoDecisionStorageKey,
    demoDecisionSchema,
  );
  const record = useDemoSessionValue(
    demoClaimStorageKey,
    demoClaimRecordSchema,
  );

  return (
    <div className="space-y-5">
      <section
        aria-label="Verified Sui Testnet payout"
        className="overflow-hidden rounded-3xl bg-[var(--brand-deep)] p-5 text-white shadow-[0_18px_55px_rgba(14,44,39,0.2)] sm:p-7"
      >
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--brand-deep)]">
              <Icon className="size-5" name="check" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                Verified on Sui Testnet
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Confirmed treasury payout
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                One human-approved payment reached finality and remained
                idempotently paid after refresh.
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
            Confirmed
          </span>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Payment", verifiedDemoEvidence.payout],
            ["Category", verifiedDemoEvidence.category],
            ["Remaining", verifiedDemoEvidence.remaining],
          ].map(([label, value]) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
              key={label}
            >
              <dt className="text-[11px] uppercase tracking-[0.1em] text-white/45">
                {label}
              </dt>
              <dd className="mt-1 text-base font-bold capitalize">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-all font-mono text-[11px] leading-5 text-white/48">
            {verifiedDemoEvidence.digest}
          </p>
          <a
            className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[var(--accent)] transition hover:text-white"
            href={verifiedDemoEvidence.explorerUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open explorer proof
            <Icon className="size-4" name="arrow" />
          </a>
        </div>
      </section>

      {decision && record && decision.claimId === record.claim.id && (
        <section
          aria-label="Latest demo decision"
          className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                <Icon className="size-5" name="check" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
                  Latest human decision
                </p>
                <h2 className="mt-1 text-lg font-bold text-emerald-950">
                  Claim{" "}
                  {decision.decision === "approve" ? "approved" : "rejected"} as
                  demo
                </h2>
                <p className="mt-1 text-sm text-emerald-900/70">
                  {record.merchant} ·{" "}
                  {formatUsdcMinor(record.claim.requestedAmountMinor)} ·{" "}
                  {decision.decidedLabel}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-800">
              {decision.resultingStatus.replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-4 border-t border-emerald-200 pt-4 text-xs leading-5 text-emerald-900/65">
            Session-only status. No database row, wallet signature, transaction
            digest, or Sui payment exists.
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[0_12px_40px_rgba(24,49,43,0.05)]">
        <div className="flex flex-col justify-between gap-3 border-b border-[var(--line)] px-5 py-5 sm:flex-row sm:items-center sm:px-7">
          <div>
            <p className="text-xs text-[var(--muted)]">Sample workspace</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
              Activity preview
            </h2>
          </div>
          <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-800">
            Sample data · no digest
          </span>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {demoActivity.map((activity) => (
            <article
              className="grid gap-3 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_150px_180px] sm:items-center sm:px-7"
              key={`${activity.title}-${activity.time}`}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[var(--muted)]">
                  <Icon
                    className="size-5"
                    name={
                      activity.title.includes("Claim") ? "receipt" : "history"
                    }
                  />
                </span>
                <div>
                  <h3 className="text-sm font-bold">{activity.title}</h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {activity.detail}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-[var(--muted)]">
                {activity.time}
              </p>
              <p className="text-xs font-semibold text-slate-500 sm:text-right">
                Demo record · no digest
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(29,91,79,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-deep)]"
          href="/dashboard/claims/new"
        >
          Submit a claim
          <Icon className="size-4" name="arrow" />
        </Link>
        <Link
          className="rounded-xl border border-[var(--line)] bg-white px-5 py-3 text-center text-sm font-bold text-[var(--muted)] transition hover:bg-slate-50"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
