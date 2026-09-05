"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { asMinorAmount, formatUsdcMinor } from "@/src/domain/money";
import type { PaidHistoryItem } from "@/src/lib/history/types";
import {
  buildLiveTreasurySummary,
  getManagedTreasuries,
  resolveSelectedTreasury,
  type ManagedDashboardClaim,
} from "@/src/lib/dashboard/live-dashboard";
import type { PersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";
import { Icon } from "./icon";

const refreshIntervalMs = 30_000;

const recommendationStyles = {
  approve: "bg-emerald-50 text-emerald-700",
  review: "bg-amber-50 text-amber-700",
  reject: "bg-rose-50 text-rose-700",
  pending: "bg-slate-100 text-slate-600",
} as const;

export function LiveOverviewDashboard() {
  const [treasuries, setTreasuries] = useState<PersistedTreasuryWorkspace[]>([]);
  const [claims, setClaims] = useState<ManagedDashboardClaim[]>([]);
  const [history, setHistory] = useState<PaidHistoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      const [treasuryResponse, claimsResponse, historyResponse] = await Promise.all([
        fetch("/api/treasuries", { cache: "no-store" }),
        fetch("/api/claims/managed", { cache: "no-store" }),
        fetch("/api/history", { cache: "no-store" }),
      ]);
      const treasuryResult = (await treasuryResponse.json()) as {
        treasuries?: PersistedTreasuryWorkspace[];
        error?: string;
      };
      const claimsResult = (await claimsResponse.json()) as {
        claims?: ManagedDashboardClaim[];
        error?: string;
      };
      const historyResult = (await historyResponse.json()) as {
        history?: PaidHistoryItem[];
        error?: string;
      };
      if (!treasuryResponse.ok || !treasuryResult.treasuries) {
        throw new Error(treasuryResult.error ?? "Treasuries could not load.");
      }
      if (!claimsResponse.ok || !claimsResult.claims) {
        throw new Error(claimsResult.error ?? "Claims could not load.");
      }
      if (!historyResponse.ok || !historyResult.history) {
        throw new Error(historyResult.error ?? "History could not load.");
      }

      const managed = getManagedTreasuries(treasuryResult.treasuries);
      setTreasuries(managed);
      setClaims(claimsResult.claims);
      setHistory(historyResult.history);
      setError(null);
      setLastUpdated(new Date());

      setSelectedId((current) => {
        const urlId =
          typeof window === "undefined"
            ? null
            : new URL(window.location.href).searchParams.get("treasury");
        return resolveSelectedTreasury(managed, current ?? urlId)?.id ?? null;
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The live dashboard could not load.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [load]);

  const selected = resolveSelectedTreasury(treasuries, selectedId);
  const summary = useMemo(
    () => (selected ? buildLiveTreasurySummary(selected, claims) : null),
    [claims, selected],
  );
  const selectedHistory = useMemo(
    () => history.filter((item) => item.treasuryId === selected?.id).slice(0, 4),
    [history, selected?.id],
  );

  function selectTreasury(nextId: string) {
    setSelectedId(nextId);
    const url = new URL(window.location.href);
    url.searchParams.set("treasury", nextId);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        <div className="rounded-3xl border border-[var(--line)] bg-white p-8 text-sm font-semibold text-[var(--muted)]">
          Loading live treasury dashboard…
        </div>
      </main>
    );
  }

  if (error && treasuries.length === 0) {
    return (
      <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
        <section className="rounded-3xl border border-rose-200 bg-white p-8">
          <p className="text-sm font-semibold text-rose-700" role="alert">{error}</p>
          <button className="mt-5 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white" onClick={() => void load()} type="button">
            Retry live dashboard
          </button>
        </section>
      </main>
    );
  }

  if (!selected || !summary) {
    return (
      <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
        <section className="rounded-3xl border border-[var(--line)] bg-white p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Icon className="size-6" name="building" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Create your first treasury</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Overview becomes a live operational dashboard after you create a treasury and set its category budget.
          </p>
          <Link className="mt-6 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white" href="/dashboard/treasury/new">
            Create treasury
          </Link>
        </section>
      </main>
    );
  }

  const spentPercent = selected.totalBudgetMinor > 0
    ? Math.min(100, Math.round((summary.spentMinor / selected.totalBudgetMinor) * 100))
    : 0;

  return (
    <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
            <Icon className="size-3.5" name="sparkles" /> Live treasury dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Good morning, Treasurer.</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Live persisted treasury, claim, budget and payment data.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs font-bold text-[var(--muted)]">
            Viewing treasury
            <select className="mt-1 block min-h-11 min-w-[240px] rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)]" onChange={(event) => selectTreasury(event.target.value)} value={selected.id}>
              {treasuries.map((treasury) => <option key={treasury.id} value={treasury.id}>{treasury.name}</option>)}
            </select>
          </label>
          <button className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--brand)] disabled:opacity-60" disabled={refreshing} onClick={() => void load(true)} type="button">
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      <div className="mt-3 text-right text-[11px] text-[var(--muted)]" aria-live="polite">
        {error ? `Last refresh warning: ${error}` : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Live data"}
      </div>

      <section aria-label="Treasury actions" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/dashboard/treasury/new", icon: "building" as const, eyebrow: "Step 1", title: "Create treasury", detail: "Start another event workspace." },
          { href: "/dashboard/budget", icon: "wallet" as const, eyebrow: "Step 2", title: "Manage budget", detail: "Review category allocations." },
          { href: "/dashboard/claims", icon: "receipt" as const, eyebrow: "Step 3", title: "Review claims", detail: "Approve, reject or prepare payout." },
          { href: "/dashboard/history", icon: "history" as const, eyebrow: "Step 4", title: "Verify history", detail: "Inspect confirmed Sui payouts." },
        ].map((action) => (
          <Link className="group flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_8px_28px_rgba(24,49,43,0.035)] transition hover:-translate-y-0.5 hover:border-emerald-200" href={action.href} key={action.title}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5" name={action.icon} /></span>
            <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{action.eyebrow}</span><span className="mt-0.5 block text-sm font-bold">{action.title}</span><span className="mt-0.5 block text-xs text-[var(--muted)]">{action.detail}</span></span>
            <Icon className="size-4 text-[var(--muted)]" name="arrow" />
          </Link>
        ))}
      </section>

      <section aria-label="Treasury summary" className="mt-7 grid gap-4 md:grid-cols-3">
        <SummaryCard label="Available balance" value={formatUsdcMinor(summary.remainingMinor).replace(" USDC", "")} detail="USDC · persisted remaining" icon="wallet" />
        <SummaryCard label="Open claims" value={String(summary.pendingClaims)} detail={`${summary.underReviewClaims} need review · ${summary.approvedUnpaidClaims} approved unpaid`} icon="receipt" />
        <SummaryCard label="Budget health" value={summary.budgetBalanced ? "Balanced" : "Review"} detail={`${selected.categories.length} persisted categories`} icon="shield" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_28px_rgba(24,49,43,0.04)] sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><p className="text-xs font-medium text-[var(--muted)]">Selected treasury</p><h2 className="mt-1 text-xl font-bold">{selected.name}</h2></div>
            <span className={`w-fit rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${selected.suiActivationStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{selected.suiActivationStatus}</span>
          </div>
          <div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-xs text-[var(--muted)]">Total allocation</p><p className="mt-1 text-2xl font-semibold">{formatUsdcMinor(asMinorAmount(selected.totalBudgetMinor))}</p></div><p className="text-right text-xs leading-5 text-[var(--muted)]">{formatUsdcMinor(summary.spentMinor)} spent<br />{formatUsdcMinor(summary.remainingMinor)} remaining</p></div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Treasury spending" aria-valuemin={0} aria-valuemax={selected.totalBudgetMinor} aria-valuenow={summary.spentMinor}><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${spentPercent}%` }} /></div>
          <div className="mt-6 space-y-4">
            {selected.categories.map((category) => {
              const remaining = Math.max(0, category.allocatedMinor - category.spentMinor);
              const percent = category.allocatedMinor > 0 ? Math.min(100, Math.round((category.spentMinor / category.allocatedMinor) * 100)) : 0;
              return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2" key={category.id}><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[var(--brand)]/70" /><span className="truncate text-sm font-semibold">{category.name}</span></div><span className="text-xs font-medium text-[var(--muted)]">{formatUsdcMinor(asMinorAmount(remaining))} left</span><div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand)]/70" style={{ width: `${percent}%` }} /></div></div>;
            })}
          </div>
        </article>

        <article className="rounded-2xl bg-[var(--brand)] p-6 text-white shadow-[0_18px_50px_rgba(24,72,63,0.18)]">
          <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]"><Icon className="size-5" name="shield" /></span><span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/65">Safety boundary</span></div>
          <h2 className="mt-8 text-2xl font-semibold">No automatic payouts.</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">AI stays advisory. Human approval and an explicit Sui wallet signature remain separate requirements.</p>
          <div className="mt-7 space-y-3 border-t border-white/10 pt-6">{["Deterministic financial rules", "Human final decision", "Explicit Sui wallet signature"].map((item) => <div className="flex items-center gap-3 text-sm text-white/75" key={item}><span className="grid size-5 place-items-center rounded-full bg-[var(--accent)] text-[var(--brand-deep)]"><Icon className="size-3" name="check" /></span>{item}</div>)}</div>
          <Link className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]" href="/dashboard/testnet">View Sui status <Icon className="size-4" name="arrow" /></Link>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_8px_28px_rgba(24,49,43,0.04)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-5 sm:px-6"><div><p className="text-xs text-[var(--muted)]">Review queue</p><h2 className="mt-1 text-lg font-bold">Recent claims</h2></div><Link className="text-xs font-semibold text-[var(--brand)]" href="/dashboard/claims">Open claims</Link></div>
          {summary.claims.length === 0 ? <p className="px-6 py-8 text-sm text-[var(--muted)]">No open claims for this treasury.</p> : <div className="divide-y divide-[var(--line)]">{summary.claims.slice(0, 5).map((claim) => {
            const status = claim.recommendation ?? "pending";
            return <Link className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6" href={`/dashboard/claims/${claim.id}`} key={claim.id}><div className="min-w-0"><span className="block truncate text-sm font-bold">{claim.merchant}</span><span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{claim.submitterName} · {claim.categoryName}</span></div><span className="text-sm font-bold">{formatUsdcMinor(asMinorAmount(claim.requestedAmountMinor))}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${recommendationStyles[status]}`}>{claim.status === "approved_unpaid" ? "Approved · unpaid" : claim.recommendation ? `Suggested: ${claim.recommendation}` : "Pending"}</span></Link>;
          })}</div>}
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_28px_rgba(24,49,43,0.04)] sm:p-6">
          <div><p className="text-xs text-[var(--muted)]">Audit preview</p><h2 className="mt-1 text-lg font-bold">Recent confirmed payouts</h2></div>
          {selectedHistory.length === 0 ? <p className="mt-6 text-sm text-[var(--muted)]">No confirmed payouts for this treasury yet.</p> : <div className="mt-6 space-y-5">{selectedHistory.map((item) => <div className="flex gap-3" key={item.claimId}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon className="size-4" name="check" /></span><div className="min-w-0"><p className="text-sm font-bold">{formatUsdcMinor(item.amountMinor)} paid</p><p className="mt-0.5 text-xs text-[var(--muted)]">{item.categoryName}</p><time className="mt-1 block text-[10px] uppercase tracking-wide text-slate-400" dateTime={item.confirmedAt}>{new Date(item.confirmedAt).toLocaleString()}</time></div></div>)}</div>}
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)]" href="/dashboard/history">Open full history <Icon className="size-4" name="arrow" /></Link>
        </article>
      </section>
    </main>
  );
}

function SummaryCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: "wallet" | "receipt" | "shield" }) {
  return <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_28px_rgba(24,49,43,0.04)]"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-[var(--muted)]">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p></div><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5" name={icon} /></span></div></article>;
}
