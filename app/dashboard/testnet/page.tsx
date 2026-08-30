import type { Metadata } from "next";
import { TestnetTreasuryPanel } from "@/src/components/testnet-treasury-panel";

export const metadata: Metadata = {
  title: "Sui Testnet demo · ClubTreasury AI",
};

export default function TestnetDemoPage() {
  return (
    <main className="mx-auto max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
          Stage 3 · real blockchain boundary
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
          Sui Testnet treasury demo
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
          Run the minimal create, deposit, allocation, and human-approved payout
          flow with native Circle Testnet USDC. All displayed identifiers and
          digests come from confirmed public Testnet responses.
        </p>
      </div>
      <TestnetTreasuryPanel />
    </main>
  );
}
