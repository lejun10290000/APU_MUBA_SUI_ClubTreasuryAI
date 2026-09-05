"use client";

import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import Link from "next/link";
import { useState } from "react";

import { SuiWalletControl } from "@/src/components/sui-wallet-control";
import { ensureWalletIdentity } from "@/src/lib/sui/wallet-identity";
import { normalizeJoinCode } from "@/src/lib/treasuries/join-code";
import type { PersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";

export function MemberJoinPanel() {
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [joinCode, setJoinCode] = useState("");
  const [treasury, setTreasury] = useState<PersistedTreasuryWorkspace | null>(
    null,
  );
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setJoining(true);
    try {
      if (!account) {
        throw new Error("Connect your Sui wallet before joining a treasury.");
      }
      await ensureWalletIdentity({
        signer: dAppKit,
        walletAddress: account.address,
        displayName: "Club member",
      });
      const normalizedCode = normalizeJoinCode(joinCode);
      const response = await fetch("/api/treasuries/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ joinCode: normalizedCode }),
      });
      const result = (await response.json()) as {
        treasury?: PersistedTreasuryWorkspace;
        error?: string;
      };
      if (!response.ok || !result.treasury) {
        throw new Error(result.error ?? "The treasury could not be joined.");
      }
      if (result.treasury.role !== "member") {
        throw new Error("Only treasury members can submit reimbursement claims.");
      }
      setTreasury(result.treasury);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The treasury could not be joined.",
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <SuiWalletControl />
      </div>
      <form
        className="rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-8"
        onSubmit={join}
      >
        <label className="text-sm font-bold" htmlFor="joinCode">
          Treasury join code
        </label>
        <input
          autoCapitalize="characters"
          className="mt-2 w-full rounded-xl border border-[var(--line)] px-4 py-3 font-mono uppercase"
          id="joinCode"
          maxLength={32}
          onChange={(event) => setJoinCode(event.target.value)}
          placeholder="ORI1-AB12CD"
          required
          value={joinCode}
        />
        {error && (
          <p className="mt-3 text-sm font-semibold text-rose-700" role="alert">
            {error}
          </p>
        )}
        <button
          className="mt-5 w-full rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          disabled={joining || !joinCode.trim()}
          type="submit"
        >
          {joining ? "Joining treasury…" : "Join treasury"}
        </button>
      </form>

      {treasury && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
          <p className="text-xs font-bold uppercase tracking-[0.12em]">
            Joined
          </p>
          <h2 className="mt-2 text-2xl font-bold">{treasury.name}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {treasury.categories.map((category) => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
          <Link
            className="mt-5 inline-flex rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white"
            href={`/member/claim?treasury=${treasury.id}`}
          >
            Submit reimbursement claim
          </Link>
        </section>
      )}
    </div>
  );
}
