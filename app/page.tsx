import Link from "next/link";
import { Icon } from "@/src/components/icon";
import { MarketingHeader } from "@/src/components/marketing-header";

const steps = [
  {
    number: "01",
    title: "Describe the budget",
    copy: "Turn a plain-language event plan into structured categories using deterministic mock AI during development.",
  },
  {
    number: "02",
    title: "Review every claim",
    copy: "Match receipts, category limits, and duplicate indicators before a treasurer makes the decision.",
  },
  {
    number: "03",
    title: "Approve with confidence",
    copy: "A human approves first. The verified Testnet demo then asks the connected treasurer wallet to sign the Sui transaction explicitly.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--brand-deep)] text-white">
      <MarketingHeader />
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(101,214,169,0.17),transparent_28%),radial-gradient(circle_at_12%_80%,rgba(202,255,116,0.12),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-20">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              <Icon className="size-4" name="sparkles" /> AI guidance · human
              approval · Sui execution
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[78px]">
              Club funds,
              <br />
              <span className="text-[var(--accent)]">clearly governed.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/62 sm:text-lg sm:leading-8">
              Replace scattered spreadsheets and chat approvals with one
              transparent treasury workflow built for university clubs.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-bold text-[var(--brand-deep)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(202,255,116,0.2)]"
                href="/login"
              >
                Open demo workspace <Icon className="size-4" name="arrow" />
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/18 px-6 py-3.5 text-sm font-semibold text-white/80 transition hover:bg-white/8 hover:text-white"
                href="/#workflow"
              >
                See the workflow
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-white/42">
              <span className="size-1.5 rounded-full bg-emerald-400" /> Stage 3
              complete · verified Sui Testnet treasury flow
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -inset-6 rounded-[40px] bg-emerald-300/8 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#f7f8f3] p-3 text-[var(--ink)] shadow-[0_32px_90px_rgba(0,0,0,0.35)] sm:p-4">
              <div className="flex items-center justify-between px-3 pb-4 pt-2">
                <span className="text-xs font-bold text-[var(--brand)]">
                  Treasury overview
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  Mock
                </span>
              </div>
              <div className="rounded-2xl bg-[var(--brand)] p-5 text-white sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-white/55">Available balance</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                      925.00{" "}
                      <span className="text-base font-medium text-white/55">
                        USDC
                      </span>
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-white/10">
                    <Icon className="size-5" name="wallet" />
                  </span>
                </div>
                <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/12">
                  <div className="h-full w-[7.5%] rounded-full bg-[var(--accent)]" />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-white/48">
                  <span>75.00 spent</span>
                  <span>1,000.00 allocated</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3">
                {[
                  ["Pending claims", "2"],
                  ["Needs review", "1"],
                  ["Budget health", "Balanced"],
                ].map(([label, value], index) => (
                  <div
                    className={`rounded-2xl border border-[var(--line)] bg-white p-4 ${index === 2 ? "col-span-2 sm:col-span-1" : ""}`}
                    key={label}
                  >
                    <p className="text-[11px] text-[var(--muted)]">{label}</p>
                    <p className="mt-1 text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white">
                  <Icon className="size-4" name="receipt" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold">
                    Campus Print Shop
                  </span>
                  <span className="block truncate text-[11px] text-[var(--muted)]">
                    Banner printing · Marketing
                  </span>
                </span>
                <span className="text-sm font-bold">75.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="bg-[var(--canvas)] py-20 text-[var(--ink)] sm:py-28"
        id="workflow"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
              One accountable flow
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
              From budget idea to verified decision.
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--line)] lg:grid-cols-3">
            {steps.map((step) => (
              <article className="bg-white p-7 sm:p-9" key={step.number}>
                <span className="text-xs font-bold text-[var(--brand)]/45">
                  {step.number}
                </span>
                <h3 className="mt-8 text-xl font-bold tracking-[-0.025em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {step.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-t border-white/8 bg-[var(--brand-deep)] py-20 sm:py-24"
        id="safety"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <span className="grid size-12 place-items-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent)]">
              <Icon className="size-6" name="shield" />
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
              AI advises.
              <br />
              Treasurers decide.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Integer-based financial rules",
              "Human approval before payout",
              "Private receipts stay off-chain",
              "No silent AI transactions",
            ].map((item) => (
              <div
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/72"
                key={item}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--brand-deep)]">
                  <Icon className="size-3.5" name="check" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
