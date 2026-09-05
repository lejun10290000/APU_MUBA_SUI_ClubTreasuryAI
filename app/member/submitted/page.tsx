import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/src/components/brand-mark";

export const metadata: Metadata = {
  title: "Claim submitted · ClubTreasury AI",
};

export default async function MemberSubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>;
}) {
  const { claim } = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-5 py-8 text-[var(--ink)] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link className="inline-flex text-[var(--brand-deep)]" href="/member">
          <BrandMark />
        </Link>
        <section className="mt-12 rounded-3xl border border-emerald-200 bg-white p-7 shadow-[0_12px_40px_rgba(24,49,43,0.05)] sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            Claim submitted
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
            Waiting for treasurer review
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Your receipt-backed claim is persisted. The treasurer must review
            the evidence and make the human decision. No payment is authorized
            from this member screen.
          </p>
          {claim && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Claim reference
              </p>
              <p className="mt-2 break-all font-mono text-xs">{claim}</p>
            </div>
          )}
          <Link
            className="mt-7 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white"
            href="/member"
          >
            Back to member workspace
          </Link>
        </section>
      </div>
    </main>
  );
}
