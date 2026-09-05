"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { asMinorAmount, formatUsdcMinor } from "@/src/domain/money";
import {
  buildLiveTreasurySummary,
  getManagedTreasuries,
  resolveSelectedTreasury,
  type ManagedDashboardClaim,
} from "@/src/lib/dashboard/live-dashboard";
import type { PaidHistoryItem } from "@/src/lib/history/types";
import type { PersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";
import { Icon } from "./icon";

const AUTO_REFRESH_MS = 30_000;

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
      setSelectedId((current) => {
        const requested = current ?? new URL(window.location.href).searchParams.get("treasury");
        return resolveSelectedTreasury(managed, requested)?.id ?? null;
      });
      setError(null);
      setLastUpdated(new Date());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The live dashboard could not load.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void load(), 0);
    const refreshTimer = window.setInterval(() => void load(true), AUTO_REFRESH_MS);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
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

  function changeTreasury(nextId: string) {
    setSelectedId(nextId);
    const url = new URL(window.location.href);
    url.searchParams.set("treasury", nextId);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  if (loading) {
    return <DashboardMessage>Loading live treasury dashboard…</DashboardMessage>;
  }

  if (error && treasuries.length === 0) {
    return (
      <DashboardMessage>
        <p className="font-semibold text-rose-700" role="alert">{error}</p>
        <button className="mt-4 rounded-xl bg-[var(--brand)] px-4 py-2.5 font-bold text-white" onClick={() => void load()} type="button">Retry</button>
      </DashboardMessage>
    );
  }

  if (!selected || !summary) {
    return (
      <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
        <section className="rounded-3xl border border-[var(--line)] bg-white p-8 text-center">
          <Icon className="mx-auto size-8 text-emerald-700" name="building" />
          <h1 className="mt-4 text-2xl font-bold">Create your first treasury</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Overview will populate from persisted live data.</p>
          <Link className="mt-5 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white" href="/dashboard/treasury/new">Create treasury</Link>
        </section>
      </main>
    );
  }

  const totalMinor = asMinorAmount(selected.totalBudgetMinor);
  const spentPercent = selected.totalBudgetMinor > 0
    ? Math.min(100, Math.round((summary.spentMinor / selected.totalBudgetMinor) * 100))
    : 0;

  return (
    <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700">
            <Icon className="size-3.5" name="sparkles" /> Live treasury dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Good morning, Treasurer.</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Persisted treasury, category, claim and payout data.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs font-bold text-[var(--muted)]">
            Viewing treasury
            <select className="mt-1 block min-h-11 min-w-[240px] rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink)]" onChange={(event) => changeTreasury(event.target.value)} value={selected.id}>
              {treasuries.map((treasury) => <option key={treasury.id} value={treasury.id}>{treasury.name}</option>)}
            </select>
          </label>
          <button className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-4 text-sm font-bold text-[var(--brand)] disabled:opacity-60" disabled={refreshing} onClick={() => void load(true)} type="button">{refreshing ? "Refreshing…" : "Refresh"}</button>
        </div>
      </header>

      <p className="mt-3 text-right text-[11px] text-[var(--muted)]" aria-live="polite">
        {error ? `Refresh warning: ${error}` : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Live data"}
      </p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Treasury actions">
        <ActionCard href="/dashboard/treasury/new" icon="building" title="Create treasury" detail="Start another event workspace." />
        <ActionCard href="/dashboard/budget" icon="wallet" title="Manage budget" detail="Review category allocations." />
        <ActionCard href="/dashboard/claims" icon="receipt" title="Review claims" detail="Make human decisions and prepare payout." />
        <ActionCard href="/dashboard/history" icon="history" title="Verify history" detail="Inspect confirmed Sui payouts." />
      </section>

      <section className="mt-7 grid gap-4 md:grid-cols-3" aria-label="Treasury summary">
        <Summary label="Available balance" value={formatUsdcMinor(summary.remainingMinor).replace(" USDC", "")} detail="USDC · persisted remaining" />
        <Summary label="Open claims" value={String(summary.pendingClaims)} detail={`${summary.underReviewClaims} need review · ${summary.approvedUnpaidClaims} approved unpaid`} />
        <Summary label="Budget health" value={summary.budgetBalanced ? "Balanced" : "Review"} detail={`${selected.categories.length} persisted categories`} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs text-[var(--muted)]">Selected treasury</p><h2 className="mt-1 text-xl font-bold">{selected.name}</h2></div>
            <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase ${selected.suiActivationStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{selected.suiActivationStatus}</span>
          </div>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs text-[var(--muted)]">Total allocation</p><p className="mt-1 text-2xl font-semibold">{formatUsdcMinor(totalMinor)}</p></div><p className="text-right text-xs leading-5 text-[var(--muted)]">{formatUsdcMinor(summary.spentMinor)} spent<br />{formatUsdcMinor(summary.remainingMinor)} remaining</p></div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Treasury spending" aria-valuemin={0} aria-valuemax={selected.totalBudgetMinor} aria-valuenow={summary.spentMinor}><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${spentPercent}%` }} /></div>
          <div className="mt-6 space-y-4">{selected.categories.map((category) => <CategoryRow key={category.id} name={category.name} allocated={category.allocatedMinor} spent={category.spentMinor} />)}</div>
        </article>

        <article className="rounded-2xl bg-[var(--brand)] p-6 text-white">
          <Icon className="size-6 text-[var(--accent)]" name="shield" />
          <h2 className="mt-6 text-2xl font-semibold">No automatic payouts.</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">AI recommendations remain advisory. The treasurer approves first, then explicitly signs the exact Sui Testnet transaction.</p>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-white/75"><p>✓ Deterministic financial rules</p><p>✓ Human final decision</p><p>✓ Explicit Sui wallet signature</p></div>
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)]" href="/dashboard/testnet">View Sui status <Icon className="size-4" name="arrow" /></Link>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5"><div><p className="text-xs text-[var(--muted)]">Review queue</p><h2 className="mt-1 text-lg font-bold">Recent claims</h2></div><Link className="text-xs font-bold text-[var(--brand)]" href="/dashboard/claims">Open claims</Link></div>
          {summary.claims.length === 0 ? <p className="px-6 py-8 text-sm text-[var(--muted)]">No open claims for this treasury.</p> : <div className="divide-y divide-[var(--line)]">{summary.claims.slice(0, 5).map((claim) => <Link className="flex flex-wrap items-center justify-between gap-3 px-6 py-4" href={`/dashboard/claims/${claim.id}`} key={claim.id}><div><p className="text-sm font-bold">{claim.merchant}</p><p className="text-xs text-[var(--muted)]">{claim.submitterName} · {claim.categoryName}</p></div><div className="text-right"><p className="text-sm font-bold">{formatUsdcMinor(asMinorAmount(claim.requestedAmountMinor))}</p><p className="text-[10px] font-bold uppercase text-[var(--muted)]">{claim.status === "approved_unpaid" ? "Approved · unpaid" : claim.recommendation ?? "Pending"}</p></div></Link>)}</div>}
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-xs text-[var(--muted)]">Audit preview</p><h2 className="mt-1 text-lg font-bold">Recent confirmed payouts</h2>
          {selectedHistory.length === 0 ? <p className="mt-5 text-sm text-[var(--muted)]">No confirmed payouts for this treasury yet.</p> : <div className="mt-5 space-y-4">{selectedHistory.map((item) => <div className="flex gap-3" key={item.claimId}><Icon className="mt-0.5 size-4 shrink-0 text-emerald-700" name="check" /><div><p className="text-sm font-bold">{formatUsdcMinor(item.amountMinor)} paid</p><p className="text-xs text-[var(--muted)]">{item.categoryName} · {new Date(item.confirmedAt).toLocaleString()}</p></div></div>)}</div>}
          <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)]" href="/dashboard/history">Open full history <Icon className="size-4" name="arrow" /></Link>
        </article>
      </section>
    </main>
  );
}

function DashboardMessage({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8"><div className="rounded-3xl border border-[var(--line)] bg-white p-8 text-sm text-[var(--muted)]">{children}</div></main>;
}

function ActionCard({ href, icon, title, detail }: { href: string; icon: "building" | "wallet" | "receipt" | "history"; title: string; detail: string }) {
  return <Link className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-4" href={href}><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5" name={icon} /></span><span><span className="block text-sm font-bold">{title}</span><span className="block text-xs text-[var(--muted)]">{detail}</span></span></Link>;
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-[var(--line)] bg-white p-5"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p></article>;
}

function CategoryRow({ name, allocated, spent }: { name: string; allocated: number; spent: number }) {
  const remaining = Math.max(0, allocated - spent);
  const percent = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2"><span className="truncate text-sm font-semibold">{name}</span><span className="text-xs text-[var(--muted)]">{formatUsdcMinor(asMinorAmount(remaining))} left</span><div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand)]/70" style={{ width: `${percent}%` }} /></div></div>;
}
