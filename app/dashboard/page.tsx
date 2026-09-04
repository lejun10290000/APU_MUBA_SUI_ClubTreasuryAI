import type { Metadata } from "next";
import Link from "next/link";
import { DemoTreasuryNotice } from "@/src/components/demo-treasury-notice";
import { Icon, type IconName } from "@/src/components/icon";
import {
  calculateCategoryRemaining,
  checkBudgetTotal,
} from "@/src/domain/budget-rules";
import { addMinorAmounts, formatUsdcMinor } from "@/src/domain/money";
import {
  demoActivity,
  demoBudget,
  demoClaims,
  demoTreasury,
} from "@/src/data/mock-dashboard";
import { verifiedDemoEvidence } from "@/src/data/verified-demo";

export const metadata: Metadata = {
  title: "Treasurer dashboard · ClubTreasury AI",
};

const statusStyles = {
  approve: "bg-emerald-50 text-emerald-700",
  review: "bg-amber-50 text-amber-700",
  reject: "bg-rose-50 text-rose-700",
  pending: "bg-slate-100 text-slate-600",
} as const;

export default function DashboardPage() {
  const spentMinor = addMinorAmounts(
    ...demoBudget.categories.map((category) => category.spentMinor),
  );
  const remainingMinor = calculateCategoryRemaining(
    demoTreasury.totalBudgetMinor,
    spentMinor,
  );
  const budgetCheck = checkBudgetTotal(
    demoBudget.totalMinor,
    demoBudget.categories.map((category) => category.allocatedMinor),
  );
  const stats: Array<{
    label: string;
    value: string;
    detail: string;
    icon: IconName;
    tone: string;
  }> = [
    {
      label: "Available balance",
      value: formatUsdcMinor(remainingMinor).replace(" USDC", ""),
      detail: "USDC · sample balance",
      icon: "wallet",
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Pending claims",
      value: "2",
      detail: "1 ready for review",
      icon: "receipt",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Budget health",
      value: budgetCheck.isBalanced ? "Balanced" : "Review",
      detail: "5 confirmed categories",
      icon: "shield",
      tone: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
            <Icon className="size-3.5" name="sparkles" /> Guided demo workspace
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Good morning, Treasurer.
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Here is the sample treasury snapshot for APU Blockchain Club.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-xs text-[var(--muted)]">
          <span className="font-semibold text-[var(--ink)]">Sample data</span> ·
          safe to explore
        </div>
      </section>

      <DemoTreasuryNotice />

      <section
        aria-label="Guided demo workflow"
        className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            href: "/dashboard/treasury/new",
            icon: "building" as const,
            eyebrow: "Step 1",
            title: "Create treasury",
            detail: "Set the event and spending limit.",
          },
          {
            href: "/dashboard/budget",
            icon: "wallet" as const,
            eyebrow: "Step 2",
            title: "Set category budget",
            detail: "Balance deterministic allocations.",
          },
          {
            href: "/dashboard/claims/new",
            icon: "receipt" as const,
            eyebrow: "Step 3",
            title: "Submit claim",
            detail: "Add request and receipt facts.",
          },
          {
            href: "/dashboard/history",
            icon: "history" as const,
            eyebrow: "Step 4",
            title: "Verify evidence",
            detail: "Compare sample activity with Sui proof.",
          },
        ].map((action) => (
          <Link
            className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_8px_28px_rgba(24,49,43,0.035)] transition hover:-translate-y-0.5 hover:border-emerald-200"
            href={action.href}
            key={action.title}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Icon className="size-5" name={action.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                {action.eyebrow}
              </span>
              <span className="mt-0.5 block text-sm font-bold">
                {action.title}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                {action.detail}
              </span>
            </span>
            <Icon
              className="size-4 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--brand)]"
              name="arrow"
            />
          </Link>
        ))}
      </section>

      <section
        aria-label="Treasury summary"
        className="mt-7 grid gap-4 md:grid-cols-3"
      >
        {stats.map((stat) => (
          <article
            className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_28px_rgba(24,49,43,0.04)]"
            key={stat.label}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {stat.detail}
                </p>
              </div>
              <span
                className={`grid size-10 place-items-center rounded-xl ${stat.tone}`}
              >
                <Icon className="size-5" name={stat.icon} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section
        className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]"
        id="treasury"
      >
        <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_28px_rgba(24,49,43,0.04)] sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-medium text-[var(--muted)]">
                Active treasury
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
                {demoTreasury.name}
              </h2>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              Sample · active
            </span>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--muted)]">Total allocation</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
                {formatUsdcMinor(demoBudget.totalMinor)}
              </p>
            </div>
            <p className="text-right text-xs leading-5 text-[var(--muted)]">
              {formatUsdcMinor(spentMinor)} spent
              <br />
              {formatUsdcMinor(remainingMinor)} remaining
            </p>
          </div>
          <div
            aria-label="Treasury spending"
            aria-valuemax={demoBudget.totalMinor}
            aria-valuemin={0}
            aria-valuenow={spentMinor}
            className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
          >
            <div className="h-full w-[7.5%] rounded-full bg-[var(--brand)]" />
          </div>
          <div className="mt-6 space-y-4">
            {demoBudget.categories.map((category) => {
              const remaining = calculateCategoryRemaining(
                category.allocatedMinor,
                category.spentMinor,
              );
              const spentPercent = Math.round(
                (category.spentMinor / category.allocatedMinor) * 100,
              );
              return (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2"
                  key={category.id}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[var(--brand)]/70" />
                    <span className="truncate text-sm font-semibold">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[var(--muted)]">
                    {formatUsdcMinor(remaining)} left
                  </span>
                  <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--brand)]/70"
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl bg-[var(--brand)] p-6 text-white shadow-[0_18px_50px_rgba(24,72,63,0.18)]">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
              <Icon className="size-5" name="shield" />
            </span>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/65">
              Safety boundary
            </span>
          </div>
          <h2 className="mt-8 text-2xl font-semibold tracking-[-0.035em]">
            No automatic payouts.
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/58">
            AI recommendations stay advisory. An approved claim can only be paid
            after the authorized treasurer signs the exact Testnet transaction.
          </p>
          <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
            {[
              "Deterministic financial rules",
              "Human final decision",
              "Explicit Sui wallet signature",
            ].map((item) => (
              <div
                className="flex items-center gap-3 text-sm text-white/72"
                key={item}
              >
                <span className="grid size-5 place-items-center rounded-full bg-[var(--accent)] text-[var(--brand-deep)]">
                  <Icon className="size-3" name="check" />
                </span>
                {item}
              </div>
            ))}
          </div>
          <a
            className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] transition hover:text-white"
            href={verifiedDemoEvidence.explorerUrl}
            rel="noreferrer"
            target="_blank"
          >
            View verified payout
            <Icon className="size-4" name="arrow" />
          </a>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <article
          className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_8px_28px_rgba(24,49,43,0.04)]"
          id="claims"
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs text-[var(--muted)]">Review queue</p>
              <h2 className="mt-1 text-lg font-bold tracking-[-0.02em]">
                Recent claims
              </h2>
            </div>
            <span className="text-xs font-semibold text-[var(--brand)]">
              Sample submissions
            </span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {demoClaims.map(({ claim, merchant, submittedLabel }) => {
              const status = claim.recommendation ?? "pending";
              const statusLabel = claim.recommendation
                ? `Suggested: ${claim.recommendation}`
                : "Awaiting receipt";
              return (
                <div
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6"
                  key={claim.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[var(--muted)]">
                      <Icon className="size-5" name="receipt" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">
                        {merchant}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                        {claim.submitterName} · {claim.description}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                    <span className="text-sm font-bold">
                      {formatUsdcMinor(claim.requestedAmountMinor)}
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      {submittedLabel}
                    </span>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[status]}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article
          className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_28px_rgba(24,49,43,0.04)] sm:p-6"
          id="activity"
        >
          <div>
            <p className="text-xs text-[var(--muted)]">Audit preview</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em]">
              Recent activity
            </h2>
          </div>
          <div className="mt-6 space-y-6">
            {demoActivity.map((activity, index) => (
              <div className="relative flex gap-3" key={activity.title}>
                {index < demoActivity.length - 1 && (
                  <span className="absolute bottom-[-24px] left-[17px] top-9 w-px bg-[var(--line)]" />
                )}
                <span
                  className={`relative z-10 mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${activity.tone === "violet" ? "bg-violet-50 text-violet-700" : activity.tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  <Icon
                    className="size-4"
                    name={
                      activity.tone === "violet"
                        ? "receipt"
                        : activity.tone === "green"
                          ? "check"
                          : "building"
                    }
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">
                    {activity.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[var(--muted)]">
                    {activity.detail}
                  </span>
                  <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {activity.time}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
