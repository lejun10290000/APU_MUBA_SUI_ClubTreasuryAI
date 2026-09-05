import type { Metadata } from "next";
import Link from "next/link";
import { SystemStatusPanel } from "@/src/components/system-status-panel";

export const metadata: Metadata = {
  title: "System status · ClubTreasury AI",
};

export default function SystemStatusPage() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] transition hover:text-[var(--brand)]"
        href="/dashboard"
      >
        ← Back to dashboard
      </Link>
      <section className="mb-7 mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--brand)]">
          Judge-facing evidence
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          System Status
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Verify which AI, database and Sui integrations are configured without exposing secrets.
        </p>
      </section>
      <SystemStatusPanel />
    </main>
  );
}
