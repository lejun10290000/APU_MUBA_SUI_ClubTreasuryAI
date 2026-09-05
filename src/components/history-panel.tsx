"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatUsdcMinor } from "@/src/domain/money";
import type { PaidHistoryItem } from "@/src/lib/history/types";
import { testnetExplorerTransactionUrl } from "@/src/lib/sui/execution";
import { Icon } from "./icon";

export function HistoryPanel() {
  const [history, setHistory] = useState<PaidHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/history", { cache: "no-store" });
        const result = (await response.json()) as {
          history?: PaidHistoryItem[];
          error?: string;
        };
        if (!response.ok || !result.history) {
          throw new Error(result.error ?? "Payment history could not load.");
        }
        if (!cancelled) setHistory(result.history);
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Payment history could not load.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="rounded-3xl border border-[var(--line)] bg-white p-6">
        Loading confirmed payments…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <p
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {error}
        </p>
      )}
      {!error && history.length === 0 && (
        <section className="rounded-3xl border border-[var(--line)] bg-white p-8 text-center">
          <h2 className="text-xl font-bold">No confirmed payouts yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Approved claims appear here only after Sui finality is confirmed and
            persisted.
          </p>
        </section>
      )}
      {history.map((item) => (
        <article
          className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-[0_12px_40px_rgba(24,49,43,0.05)] sm:p-7"
          key={item.claimId}
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                <Icon className="size-5" name="check" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                  Confirmed on Sui Testnet
                </p>
                <h3 className="mt-1 text-lg font-bold">{item.treasuryName}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.categoryName} · {formatUsdcMinor(item.amountMinor)}
                </p>
              </div>
            </div>
            <time
              className="text-xs font-semibold text-[var(--muted)]"
              dateTime={item.confirmedAt}
            >
              {new Date(item.confirmedAt).toLocaleString()}
            </time>
          </div>
          <dl className="mt-5 space-y-3 border-t border-[var(--line)] pt-5 text-xs">
            <div>
              <dt className="font-bold">Recipient</dt>
              <dd className="mt-1 break-all font-mono text-[var(--muted)]">
                {item.recipient}
              </dd>
            </div>
            <div>
              <dt className="font-bold">Transaction digest</dt>
              <dd className="mt-1 break-all font-mono text-[var(--muted)]">
                {item.digest}
              </dd>
            </div>
          </dl>
          <a
            aria-label={`Open Sui Testnet transaction ${item.digest}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--brand)]"
            href={testnetExplorerTransactionUrl(item.digest) ?? undefined}
            rel="noreferrer"
            target="_blank"
          >
            Open explorer proof <Icon className="size-4" name="arrow" />
          </a>
        </article>
      ))}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          className="rounded-xl bg-[var(--brand)] px-5 py-3 text-center text-sm font-bold text-white"
          href="/dashboard/claims/new"
        >
          Submit a claim
        </Link>
        <Link
          className="rounded-xl border border-[var(--line)] bg-white px-5 py-3 text-center text-sm font-bold text-[var(--muted)]"
          href="/dashboard"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
