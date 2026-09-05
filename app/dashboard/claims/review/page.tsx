import type { Metadata } from "next";
import Link from "next/link";
import { ClaimReviewPanel } from "@/src/components/claim-review-panel";
import { Icon } from "@/src/components/icon";

export const metadata: Metadata = {
  title: "Review claim · ClubTreasury AI",
};

export default function ClaimReviewPage() {
  return (
    <main className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--brand)]"
        href="/dashboard/claims"
      >
        <span aria-hidden="true">←</span> Back to claims
      </Link>
      <section className="mb-7 mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800">
            <Icon className="size-3.5" name="shield" /> Human review
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Review the claim
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Inspect persisted AI evidence and deterministic checks before saving
            the final unpaid decision.
          </p>
        </div>
        <span className="w-fit rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--muted)]">
          Approval remains unpaid
        </span>
      </section>
      <ClaimReviewPanel />
    </main>
  );
}
