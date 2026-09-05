import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "@/src/components/brand-mark";
import { LiveClaimSubmissionForm } from "@/src/components/live-claim-submission-form";
import { SuiWalletControl } from "@/src/components/sui-wallet-control";

export const metadata: Metadata = {
  title: "Submit claim · ClubTreasury AI",
};

export default function MemberClaimPage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-5 py-8 text-[var(--ink)] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link className="inline-flex text-[var(--brand-deep)]" href="/member">
            <BrandMark />
          </Link>
          <SuiWalletControl />
        </div>
        <section className="mb-7 mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
            Member workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Submit reimbursement claim
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Your verified member wallet becomes the payout recipient. Submission
            sends the claim to the treasurer for review; members cannot approve
            or pay claims.
          </p>
        </section>
        <LiveClaimSubmissionForm />
      </div>
    </main>
  );
}
