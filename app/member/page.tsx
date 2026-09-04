import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/src/components/brand-mark";
import { MemberJoinPanel } from "@/src/components/member-join-panel";

export const metadata: Metadata = {
  title: "Member claim portal · ClubTreasury AI",
};

export default function MemberPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-5 py-8 text-[var(--ink)] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link className="inline-flex text-[var(--brand-deep)]" href="/">
          <BrandMark />
        </Link>
        <section className="mb-7 mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
            Member workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Join your club treasury
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Verify your wallet, enter the code from your finance committee, and
            submit a receipt-backed reimbursement claim. Joining never signs a
            payment transaction.
          </p>
        </section>
        <MemberJoinPanel />
      </div>
    </main>
  );
}
