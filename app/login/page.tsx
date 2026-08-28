import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/src/components/brand-mark";
import { Icon } from "@/src/components/icon";

export const metadata: Metadata = { title: "Demo access · ClubTreasury AI" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen bg-[var(--brand-deep)] text-white lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/8 p-12 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(202,255,116,0.13),transparent_32%),radial-gradient(circle_at_90%_90%,rgba(101,214,169,0.16),transparent_30%)]" />
        <Link className="relative z-10 w-fit" href="/">
          <BrandMark />
        </Link>
        <div className="relative z-10 my-auto max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Stage 2 demo access
          </p>
          <h2 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.055em]">
            A calmer way to run club finances.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-white/58">
            Explore the treasurer workspace using deterministic mock data. No
            account, wallet, or external service is connected.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/35">
          MUBA Blockchain Hackathon 2026 · Sui tracks
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-5 py-12 text-[var(--ink)] sm:px-8">
        <div className="w-full max-w-lg">
          <Link
            className="mb-12 inline-flex text-[var(--brand-deep)] lg:hidden"
            href="/"
          >
            <BrandMark />
          </Link>
          <div className="mb-8">
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
              Demo only · no authentication
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Choose your workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Role selection is a Stage 2 navigation preview. Real wallet
              identity arrives later.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              className="group flex items-center gap-4 rounded-2xl border border-[var(--brand)] bg-white p-5 shadow-[0_16px_48px_rgba(16,49,43,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_52px_rgba(16,49,43,0.12)]"
              href="/dashboard"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand)] text-white">
                <Icon className="size-6" name="user" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">Continue as treasurer</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  Review budgets, claims, and activity
                </span>
              </span>
              <Icon
                className="size-5 text-[var(--brand)] transition group-hover:translate-x-1"
                name="arrow"
              />
            </Link>
            <div
              aria-disabled="true"
              className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white/65 p-5 text-[var(--muted)]"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100">
                <Icon className="size-6" name="receipt" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-600">
                  Member claim portal
                </span>
                <span className="mt-1 block text-sm">
                  Coming in the claim workflow task
                </span>
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                Next
              </span>
            </div>
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <Icon className="mt-0.5 size-4 shrink-0" name="shield" />
            <p>
              <strong>Safe preview:</strong> every value is synthetic. Buttons
              cannot sign transactions or move funds.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
