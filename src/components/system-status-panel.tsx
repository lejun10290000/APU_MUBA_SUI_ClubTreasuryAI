"use client";

import { useEffect, useState } from "react";
import {
  describeSystemHealth,
  type SystemHealthResponse,
} from "@/src/lib/system/status";
import { SystemBoundaryBadges } from "./system-boundary-badges";

export function SystemStatusPanel() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as SystemHealthResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "System status could not load.");
        }
        if (!cancelled) setHealth(result);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "System status could not load.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
        {error}
      </p>
    );
  }
  if (!health) {
    return (
      <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
        Checking live system readiness…
      </p>
    );
  }

  const summary = describeSystemHealth(health);
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_12px_40px_rgba(24,49,43,0.05)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand)]">
              Live readiness
            </p>
            <h2 className="mt-2 text-2xl font-bold">{summary.overall}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Safe configuration evidence only. Secret keys and wallet credentials are never displayed.
            </p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${health.ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            Stage {health.stage}
          </span>
        </div>
        <div className="mt-5">
          <SystemBoundaryBadges />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          title="Gemini AI"
          status={summary.ai}
          details={[
            `Model: ${health.readiness.ai.model}`,
            `Live requests: ${health.readiness.ai.liveRequestsEnabled ? "enabled" : "disabled"}`,
            `API key configured: ${health.readiness.ai.apiKeyConfigured ? "yes" : "no"}`,
          ]}
        />
        <StatusCard
          title="Supabase"
          status={summary.supabase}
          details={[
            `Claim mode: ${health.readiness.claims.mode}`,
            `Configured: ${health.readiness.claims.supabaseConfigured ? "yes" : "no"}`,
          ]}
        />
        <StatusCard
          title="Sui"
          status={summary.sui}
          details={[
            `Network: ${health.readiness.sui.network}`,
            `Move package configured: ${health.readiness.sui.packageConfigured ? "yes" : "no"}`,
          ]}
        />
      </div>
    </div>
  );
}

function StatusCard({
  title,
  status,
  details,
}: {
  title: string;
  status: string;
  details: string[];
}) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        {title}
      </p>
      <h3 className="mt-2 text-lg font-bold">{status}</h3>
      <ul className="mt-4 space-y-2 text-xs leading-5 text-[var(--muted)]">
        {details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    </section>
  );
}
