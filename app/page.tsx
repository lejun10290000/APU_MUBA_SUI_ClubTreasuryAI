import { publicConfig } from "@/src/config/env";

const checks = [
  ["Application", "ready"],
  ["AI mode", publicConfig.aiMode],
  ["Sui network", publicConfig.suiNetwork],
  ["Gemini live requests", publicConfig.geminiLiveRequestsEnabled ? "enabled" : "disabled"],
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)]/90 p-8 shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">MUBA Blockchain Hackathon 2026</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">ClubTreasury AI</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Stage 1 application foundation. AI is mock-first, money rules stay deterministic, and Sui will execute approved testnet payments in later stages.
        </p>
      </section>

      <section aria-label="Foundation health" className="grid gap-4 sm:grid-cols-2">
        {checks.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="text-sm text-[var(--muted)]">{label}</div>
            <div className="mt-1 font-mono text-lg text-violet-200">{value}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
