"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { asMinorAmount, formatUsdcMinor } from "@/src/domain/money";

type ManagedClaim = {
  id: string;
  treasuryName: string;
  categoryName: string;
  merchant: string;
  submitterName: string;
  requestedAmountMinor: number;
  recommendation: "approve" | "review" | "reject" | null;
  status: "submitted" | "under_review" | "approved_unpaid";
  paymentStatus: "unpaid" | "paid";
  createdAt: string;
};

export function TreasurerClaimsPanel() {
  const [claims, setClaims] = useState<ManagedClaim[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/claims/managed", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          claims?: ManagedClaim[];
          error?: string;
        };
        if (!response.ok || !result.claims) {
          throw new Error(result.error ?? "Managed claims could not load.");
        }
        if (active) setClaims(result.claims);
      })
      .catch((caught) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Managed claims could not load.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
        {error}
      </section>
    );
  }
  if (!claims) {
    return (
      <section className="rounded-3xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
        Loading claims for your treasuries…
      </section>
    );
  }
  if (claims.length === 0) {
    return (
      <section className="rounded-3xl border border-[var(--line)] bg-white p-8">
        <h2 className="text-xl font-bold">No claims need action</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Members submit reimbursement claims from the member portal. New
          reviewable claims will appear here automatically.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <article
          className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_10px_32px_rgba(24,49,43,0.04)] sm:p-6"
          key={claim.id}
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand)]">
                {claim.treasuryName} · {claim.categoryName}
              </p>
              <h2 className="mt-2 text-xl font-bold">{claim.merchant}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {claim.submitterName} · {formatUsdcMinor(asMinorAmount(claim.requestedAmountMinor))}
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-700">
              {claim.status === "approved_unpaid"
                ? "Approved · unpaid"
                : claim.status === "submitted"
                  ? "AI processing"
                  : `Recommendation · ${claim.recommendation ?? "review"}`}
            </span>
          </div>
          <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-[var(--muted)]">
              Submitted {new Date(claim.createdAt).toLocaleString()}
            </p>
            <Link
              className="inline-flex justify-center rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white"
              href={`/dashboard/claims/review?claim=${claim.id}`}
            >
              {claim.status === "approved_unpaid" ? "Open payment" : "Review claim"}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
