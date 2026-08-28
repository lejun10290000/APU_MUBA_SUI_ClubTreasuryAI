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
            <p className="text-xs text-[var(--muted)]">
              Audit and transaction shell
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
              Demo activity history
            </h2>
          </div>
          <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-800">
            No on-chain transactions
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
          Submit another demo claim
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
