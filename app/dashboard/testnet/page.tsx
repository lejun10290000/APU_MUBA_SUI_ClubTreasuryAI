import type { Metadata } from "next";
import { Icon } from "@/src/components/icon";
import { TestnetTreasuryPanel } from "@/src/components/testnet-treasury-panel";
import { verifiedDemoEvidence } from "@/src/data/verified-demo";

export const metadata: Metadata = {
  title: "Sui Testnet proof · ClubTreasury AI",
};

export default function TestnetDemoPage() {
  return (
    <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
          Wallet-controlled execution
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          Sui Testnet execution and proof
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Inspect the deployed package and public evidence. Transaction controls
          remain explicit and require one wallet signature for each Testnet
          action.
        </p>
      </div>
      <section className="mb-6 overflow-hidden rounded-3xl bg-[var(--brand-deep)] p-5 text-white shadow-[0_18px_55px_rgba(14,44,39,0.2)] sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--brand-deep)]">
              <Icon className="size-5" name="check" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                Production rehearsal evidence
              </p>
              <h2 className="mt-1 text-xl font-bold">
                {verifiedDemoEvidence.payout} payout confirmed
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                The verified payout used the {verifiedDemoEvidence.category}{" "}
                category and left {verifiedDemoEvidence.remaining} remaining. No
                new transaction is needed to inspect the proof.
              </p>
            </div>
          </div>
          <a
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-[var(--brand-deep)] transition hover:bg-white"
            href={verifiedDemoEvidence.explorerUrl}
            rel="noreferrer"
            target="_blank"
          >
            View explorer proof
            <Icon className="size-4" name="arrow" />
          </a>
        </div>
        <p className="mt-5 break-all border-t border-white/10 pt-5 font-mono text-[11px] leading-5 text-white/45">
          {verifiedDemoEvidence.digest}
        </p>
      </section>

      <details className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_40px_rgba(24,49,43,0.05)] sm:p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-1 py-1">
          <span>
            <span className="block text-sm font-bold">
              Live transaction controls
            </span>
            <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
              Optional operator flow · every action requires a wallet signature
            </span>
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-800">
            Expand carefully
          </span>
        </summary>
        <div className="mt-5 border-t border-[var(--line)] pt-5">
          <TestnetTreasuryPanel />
        </div>
      </details>
    </main>
  );
}
