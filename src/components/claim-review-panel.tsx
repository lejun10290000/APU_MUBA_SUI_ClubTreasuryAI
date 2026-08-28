"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Icon } from "./icon";
import { useDemoSessionValue, writeDemoSessionValue } from "./use-demo-session";
import { evaluateClaimRules } from "@/src/domain/claim-rules";
import {
  buildDemoDecision,
  demoBudgetStorageKey,
  demoClaimRecordSchema,
  demoClaimStorageKey,
  demoDecisionStorageKey,
  type HumanDecision,
} from "@/src/domain/demo-workflow";
import { formatUsdcMinor } from "@/src/domain/money";
import { budgetSchema } from "@/src/domain/schemas";
import { demoBudget, demoClaims } from "@/src/data/mock-dashboard";

const recommendationStyles = {
  approve: "border-emerald-200 bg-emerald-50 text-emerald-800",
  review: "border-amber-200 bg-amber-50 text-amber-800",
  reject: "border-rose-200 bg-rose-50 text-rose-800",
} as const;

export function ClaimReviewPanel() {
  const router = useRouter();
  const sessionClaim = useDemoSessionValue(
    demoClaimStorageKey,
    demoClaimRecordSchema,
  );
  const sessionBudget = useDemoSessionValue(demoBudgetStorageKey, budgetSchema);
  const record = sessionClaim ?? demoClaims[0];
  const budget = sessionClaim && sessionBudget ? sessionBudget : demoBudget;
  const category =
    budget.categories.find(
      (candidate) => candidate.id === record.claim.categoryId,
    ) ?? demoBudget.categories[0];
  const evaluation = useMemo(
    () =>
      evaluateClaimRules({
        claim: record.claim,
        merchant: record.merchant,
        receiptReference: record.receiptReference,
        existingClaims: demoClaims.map((existing) => ({
          id: existing.claim.id,
          merchant: existing.merchant,
          receiptReference: existing.receiptReference,
          requestedAmountMinor: existing.claim.requestedAmountMinor,
        })),
        categoryAllocatedMinor: category.allocatedMinor,
        categorySpentMinor: category.spentMinor,
      }),
    [category.allocatedMinor, category.spentMinor, record],
  );

  const decide = (decision: HumanDecision) => {
    const result = buildDemoDecision(
      record.claim.id,
      decision,
      evaluation.recommendation,
    );
    writeDemoSessionValue(demoDecisionStorageKey, result);
    router.push("/dashboard/history");
  };

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
                Claim under review
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
                {record.merchant}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {record.claim.submitterName} · {record.claim.description}
              </p>
            </div>
          </div>
          <span
            className={`w-fit rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${recommendationStyles[evaluation.recommendation]}`}
          >
            Rules suggest {evaluation.recommendation}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Requested"
            value={formatUsdcMinor(record.claim.requestedAmountMinor)}
          />
          <Metric
            label="Receipt"
            value={
              record.claim.receiptAmountMinor
                ? formatUsdcMinor(record.claim.receiptAmountMinor)
                : "Missing"
            }
          />
          <Metric label="Category" value={category.name} />
          <Metric
            label="Receipt reference"
            value={record.receiptReference ?? "Not provided"}
          />
        </div>

        <div className="mt-7">
          <h3 className="text-sm font-bold">Deterministic checks</h3>
          <div className="mt-3 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
            <RuleRow
              label="Receipt amount"
              passed={evaluation.receipt.matches}
              value={receiptStatusLabel(evaluation.receipt.status)}
            />
            <RuleRow
              label="Exact duplicate"
              passed={!evaluation.duplicates.hasExact}
              value={
                evaluation.duplicates.hasExact
                  ? "Matching receipt reference found"
                  : "No exact match"
              }
            />
            <RuleRow
              label="Similar duplicate"
              passed={!evaluation.duplicates.hasSimilar}
              value={
                evaluation.duplicates.hasSimilar
                  ? "Same merchant and amount found"
                  : "No similar match"
              }
            />
            <RuleRow
              label="Category remaining"
              passed={evaluation.hasSufficientBudget}
              value={
                evaluation.hasSufficientBudget
                  ? "Enough budget remains"
                  : "Requested amount exceeds remaining budget"
              }
            />
          </div>
        </div>

        <div className="mt-7 rounded-2xl bg-slate-50 p-5">
          <h3 className="text-sm font-bold">Why this recommendation?</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
            {evaluation.reasons.map((reason) => (
              <li className="flex gap-2" key={reason}>
                <span aria-hidden="true" className="text-[var(--brand)]">
                  •
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="rounded-xl px-4 py-3 text-center text-sm font-bold text-[var(--muted)] transition hover:bg-slate-100"
            href="/dashboard/claims/new"
          >
            Edit claim
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
              onClick={() => decide("reject")}
              type="button"
            >
              Reject as demo
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(29,91,79,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-deep)]"
              onClick={() => decide("approve")}
              type="button"
            >
              Approve as demo
              <Icon className="size-4" name="check" />
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-3xl bg-[var(--brand-deep)] p-6 text-white shadow-[0_18px_50px_rgba(24,72,63,0.16)] sm:p-7">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
            <Icon className="size-5" name="shield" />
          </span>
          <p className="mt-7 text-xs text-white/50">Decision boundary</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
            Human approval stays final.
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/58">
            The rule result is advisory. These buttons update session-only demo
            state and cannot sign or execute a payment.
          </p>
          <div className="mt-6 border-t border-white/10 pt-5 text-sm text-white/68">
            Recommendation:{" "}
            <strong className="capitalize text-white">
              {evaluation.recommendation}
            </strong>
          </div>
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
            No payout occurs
          </p>
          <p className="mt-3 text-sm leading-6 text-amber-950/70">
            An approved mock claim becomes “approved, unpaid.” Wallet signing
            and Sui execution begin only in later stages.
          </p>
        </section>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-slate-50/60 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold">{value}</p>
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
    <div className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full ${passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
        >
          <Icon className="size-3.5" name={passed ? "check" : "clock"} />
        </span>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <span className="text-xs text-[var(--muted)] sm:text-right">{value}</span>
    </div>
  );
}

function receiptStatusLabel(
  status: "missing" | "match" | "receipt_lower" | "receipt_higher",
): string {
  const labels = {
    missing: "Receipt amount missing",
    match: "Exact amount match",
    receipt_lower: "Receipt is lower than request",
    receipt_higher: "Receipt is higher than request",
  } as const;
  return labels[status];
}
