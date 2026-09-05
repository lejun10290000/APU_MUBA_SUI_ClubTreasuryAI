import type { Metadata } from "next";

import { TreasurerClaimsPanel } from "@/src/components/treasurer-claims-panel";

export const metadata: Metadata = {
  title: "Claims review · ClubTreasury AI",
};

export default function TreasurerClaimsPage() {
  return (
    <main className="p-5 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-5xl">
        <section className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
            Treasurer claims
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Review member claims
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Members submit claims. The treasurer reviews stored AI evidence and
            deterministic checks, then makes the final human decision. Approval
            remains unpaid until a separate wallet-signed payment.
          </p>
        </section>
        <TreasurerClaimsPanel />
      </div>
    </main>
  );
}
