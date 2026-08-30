import type { Metadata } from "next";
import Link from "next/link";
import { ClaimSubmissionForm } from "@/src/components/claim-submission-form";
import { Icon } from "@/src/components/icon";

export const metadata: Metadata = {
  title: "Submit claim · ClubTreasury AI",
};

export default function NewClaimPage() {
  return (
    <main className="mx-auto max-w-[1280px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--brand)]"
        href="/dashboard"
      >
        <span aria-hidden="true">←</span> Back to dashboard
      </Link>
      <section className="mb-7 mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
            <Icon className="size-3.5" name="receipt" /> Stage 5 · claim and
            receipt
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Submit a claim
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Store private receipt evidence, run one AI analysis, then persist
            deterministic checks for human review.
          </p>
        </div>
        <span className="w-fit rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--muted)]">
          Private upload · human final
        </span>
      </section>
      <ClaimSubmissionForm />
    </main>
  );
}
