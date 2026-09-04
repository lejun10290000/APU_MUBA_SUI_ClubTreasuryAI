import type { Metadata } from "next";
import Link from "next/link";
import { HistoryPanel } from "@/src/components/history-panel";
import { Icon } from "@/src/components/icon";

export const metadata: Metadata = {
  title: "Activity history · ClubTreasury AI",
};

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--brand)]"
        href="/dashboard"
      >
        <span aria-hidden="true">←</span> Back to dashboard
      </Link>
      <section className="mb-7 mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-sky-700">
            <Icon className="size-3.5" name="history" /> Audit trail
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Activity and transaction history
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Separate sample workflow activity from independently verifiable Sui
            Testnet payment evidence.
          </p>
        </div>
        <span className="w-fit rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--muted)]">
          Sample activity + live proof
        </span>
      </section>
      <HistoryPanel />
    </main>
  );
}
