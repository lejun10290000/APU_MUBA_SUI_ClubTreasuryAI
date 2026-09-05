import type { Metadata } from "next";
import Link from "next/link";

import { DemoTreasuryNotice } from "@/src/components/demo-treasury-notice";
import { Icon } from "@/src/components/icon";
import { LiveOverviewDashboard } from "@/src/components/live-overview-dashboard";
import { publicConfig } from "@/src/config/public-env";
import { demoTreasury } from "@/src/data/mock-dashboard";

export const metadata: Metadata = {
  title: "Treasurer dashboard · ClubTreasury AI",
};

export default function DashboardPage() {
  if (publicConfig.claimDataMode === "live") {
    return <LiveOverviewDashboard />;
  }

  return <MockOverviewFallback />;
}

function MockOverviewFallback() {
  return (
    <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
            <Icon className="size-3.5" name="sparkles" /> Development preview
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Good morning, Treasurer.
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Mock mode keeps a safe local preview. Production Overview uses live persisted treasury data.
          </p>
        </div>
      </section>

      <DemoTreasuryNotice />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Development workflow">
        {[
          { href: "/dashboard/treasury/new", icon: "building" as const, title: "Create treasury", detail: "Set the event and spending limit." },
          { href: "/dashboard/budget", icon: "wallet" as const, title: "Manage budget", detail: "Balance category allocations." },
          { href: "/dashboard/claims", icon: "receipt" as const, title: "Review claims", detail: "Inspect the review queue." },
          { href: "/dashboard/history", icon: "history" as const, title: "Verify history", detail: "Inspect persisted payout evidence." },
        ].map((action) => (
          <Link className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-4" href={action.href} key={action.title}>
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Icon className="size-5" name={action.icon} />
            </span>
            <span>
              <span className="block text-sm font-bold">{action.title}</span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">{action.detail}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-xs font-medium text-[var(--muted)]">Development treasury</p>
          <h2 className="mt-1 text-xl font-bold">{demoTreasury.name}</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Mock-only data is never presented as the production live dashboard.
          </p>
        </article>
        <article className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-xs text-[var(--muted)]">Review queue</p>
          <h2 className="mt-1 text-lg font-bold">Recent claims</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Live mode filters claims by the treasury selected on Overview.
          </p>
        </article>
      </section>
    </main>
  );
}
