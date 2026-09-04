import type { Metadata } from "next";
import Link from "next/link";
import { BudgetBuilder } from "@/src/components/budget-builder";
import { Icon } from "@/src/components/icon";
import { publicConfig } from "@/src/config/public-env";

export const metadata: Metadata = {
  title: "Build budget · ClubTreasury AI",
};

export default function BudgetPage() {
  const live = publicConfig.claimDataMode === "live";
  return (
    <main className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--brand)]"
        href="/dashboard"
      >
        <span aria-hidden="true">←</span> Back to dashboard
      </Link>
      <section className="mb-7 mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
            <Icon className="size-3.5" name="grid" />{" "}
            {live
              ? "Stage 8 · persisted budget"
              : "Stage 2 · deterministic budget"}
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Build the category budget
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Create an editable budget and balance every category before
            confirmation.
          </p>
        </div>
        <span className="w-fit rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--muted)]">
          {live
            ? "Saved workspace · deterministic totals"
            : "Mock only · no Gemini parsing"}
        </span>
      </section>
      <BudgetBuilder />
    </main>
  );
}
