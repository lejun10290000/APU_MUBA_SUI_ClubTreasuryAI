"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { useForm, useWatch } from "react-hook-form";
import { ZodError } from "zod";
import { Icon } from "./icon";
import {
  removeDemoSessionValue,
  writeDemoSessionValue,
} from "./use-demo-session";
import {
  demoBudgetStorageKey,
  demoClaimStorageKey,
  demoDecisionStorageKey,
} from "@/src/domain/demo-workflow";
import { formatUsdcMinor, parseUsdcDisplay } from "@/src/domain/money";
import { publicConfig } from "@/src/config/public-env";
import { ensureWalletIdentity } from "@/src/lib/sui/wallet-identity";
import {
  buildDemoTreasury,
  demoTreasuryStorageKey,
  type TreasurySetupFields,
} from "@/src/domain/treasury-setup";

export function TreasuryCreationForm() {
  const router = useRouter();
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const live = publicConfig.claimDataMode === "live";
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TreasurySetupFields>({
    defaultValues: {
      eventName: "",
      totalBudget: "",
    },
  });
  const [eventName = "", totalBudget = ""] = useWatch({
    control,
    name: ["eventName", "totalBudget"],
  });
  const previewAmount = useMemo(() => {
    try {
      const amount = parseUsdcDisplay(totalBudget);
      return amount > 0 ? formatUsdcMinor(amount) : null;
    } catch {
      return null;
    }
  }, [totalBudget]);

  const submitTreasury = async (values: TreasurySetupFields) => {
    try {
      const treasury = buildDemoTreasury(values);
      if (live) {
        if (!account) {
          throw new Error(
            "Connect the treasurer wallet before creating a treasury.",
          );
        }
        await ensureWalletIdentity({
          signer: dAppKit,
          walletAddress: account.address,
          displayName: "Club treasurer",
        });
        const response = await fetch("/api/treasuries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: treasury.name,
            totalBudgetMinor: treasury.totalBudgetMinor,
          }),
        });
        const result = (await response.json()) as {
          treasury?: { id: string };
          error?: string;
        };
        if (!response.ok || !result.treasury) {
          throw new Error(result.error ?? "The treasury could not be created.");
        }
        router.push(`/dashboard/budget?treasury=${result.treasury.id}`);
        return;
      }
      writeDemoSessionValue(demoTreasuryStorageKey, treasury);
      removeDemoSessionValue(demoBudgetStorageKey);
      removeDemoSessionValue(demoClaimStorageKey);
      removeDemoSessionValue(demoDecisionStorageKey);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          const field = issue.path[0];
          if (field === "eventName" || field === "totalBudget") {
            setError(field, { type: "validation", message: issue.message });
          }
        }
        return;
      }

      setError("root", {
        type: "validation",
        message:
          error instanceof Error
            ? error.message
            : live
              ? "The treasury could not be created."
              : "The sample preview could not be created. Please try again.",
      });
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <form
        className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(24,49,43,0.05)] sm:p-8"
        noValidate
        onSubmit={handleSubmit(submitTreasury)}
      >
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Icon className="size-5" name="building" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--brand)]">
              Treasury details
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
              Set the event and spending limit
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {live
                ? "This saves an off-chain treasury workspace. Sui linking remains a separate owner-controlled step."
                : "This creates a temporary preview in this browser tab. It does not save a record, connect a wallet, or move funds."}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label className="text-sm font-bold" htmlFor="eventName">
              Event or treasury name
            </label>
            <p className="mt-1 text-xs text-[var(--muted)]" id="eventNameHint">
              Use a name your finance committee will recognize.
            </p>
            <input
              aria-describedby={`eventNameHint${errors.eventName ? " eventNameError" : ""}`}
              aria-invalid={Boolean(errors.eventName)}
              className="mt-2.5 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-emerald-100"
              id="eventName"
              maxLength={80}
              placeholder="e.g. Orientation Night 2026"
              {...register("eventName")}
            />
            {errors.eventName && (
              <p
                className="mt-2 text-xs font-semibold text-rose-700"
                id="eventNameError"
                role="alert"
              >
                {errors.eventName.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold" htmlFor="totalBudget">
              Total budget
            </label>
            <p className="mt-1 text-xs text-[var(--muted)]" id="budgetHint">
              Enter USDC with up to two decimal places. We convert it to integer
              minor units before validation.
            </p>
            <div className="relative mt-2.5">
              <input
                aria-describedby={`budgetHint${errors.totalBudget ? " budgetError" : ""}`}
                aria-invalid={Boolean(errors.totalBudget)}
                className="w-full rounded-xl border border-[var(--line)] bg-white py-3 pl-4 pr-20 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-emerald-100"
                id="totalBudget"
                inputMode="decimal"
                placeholder="2500.00"
                {...register("totalBudget")}
              />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-bold text-[var(--muted)]">
                USDC
              </span>
            </div>
            {errors.totalBudget && (
              <p
                className="mt-2 text-xs font-semibold text-rose-700"
                id="budgetError"
                role="alert"
              >
                {errors.totalBudget.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-slate-50/70 p-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Currency
              </p>
              <p className="mt-1 text-sm font-bold">USDC · locked for MVP</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                Initial status
              </p>
              <p className="mt-1 text-sm font-bold">
                {live ? "Saved workspace" : "Sample draft"}
              </p>
            </div>
          </div>
        </div>

        {errors.root && (
          <p
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            role="alert"
          >
            {errors.root.message}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="rounded-xl px-4 py-3 text-center text-sm font-bold text-[var(--muted)] transition hover:bg-slate-100 hover:text-[var(--ink)]"
            href="/dashboard"
          >
            Cancel
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(29,91,79,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {live ? "Create treasury" : "Create sample treasury"}
            <Icon className="size-4" name="arrow" />
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        <section
          aria-live="polite"
          className="overflow-hidden rounded-3xl bg-[var(--brand)] p-6 text-white shadow-[0_18px_50px_rgba(24,72,63,0.18)] sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
              <Icon className="size-5" name="wallet" />
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
              {live ? "Saved workspace" : "Live preview"}
            </span>
          </div>
          <p className="mt-8 text-xs font-semibold text-white/55">
            Treasury preview
          </p>
          <h2 className="mt-1 min-h-16 text-2xl font-semibold tracking-[-0.035em]">
            {eventName.trim() || "Your event name"}
          </h2>
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs text-white/55">Spending limit</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
              {previewAmount ?? "—"}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
            <Icon className="size-4" name="shield" />
            Integer minor-unit validation
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
            <Icon className="size-4" name="shield" />{" "}
            {live ? "Safety boundary" : "Demo boundary"}
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-5 text-amber-950/70">
            {live ? (
              <>
                <li>• Stored in the authenticated workspace</li>
                <li>• Starts unlinked to every Sui treasury</li>
                <li>• No deposit or on-chain transaction</li>
              </>
            ) : (
              <>
                <li>• Stored only for this browser session</li>
                <li>• No Supabase persistence</li>
                <li>• No wallet, deposit, or on-chain treasury</li>
              </>
            )}
          </ul>
        </section>
      </aside>
    </div>
  );
}
