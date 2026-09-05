"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ZodError } from "zod";
import { Icon } from "./icon";
import { AIProvenanceCard } from "./ai-provenance-card";
import { SystemBoundaryBadges } from "./system-boundary-badges";
import {
  removeDemoSessionValue,
  useDemoSessionValue,
  writeDemoSessionValue,
} from "./use-demo-session";
import { checkBudgetTotal } from "@/src/domain/budget-rules";
import {
  buildDemoBudget,
  demoBudgetStorageKey,
  demoClaimStorageKey,
  demoDecisionStorageKey,
  type BudgetSetupFields,
} from "@/src/domain/demo-workflow";
import {
  addMinorAmounts,
  asMinorAmount,
  formatUsdcMinor,
  parseUsdcDisplay,
  type MinorAmount,
} from "@/src/domain/money";
import { treasurySchema } from "@/src/domain/schemas";
import { demoTreasuryStorageKey } from "@/src/domain/treasury-setup";
import { demoTreasury } from "@/src/data/mock-dashboard";
import { publicConfig } from "@/src/config/public-env";
import type { BudgetDraftResponse } from "@/src/lib/ai/types";
import type { PersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";
import type { PersistedBudgetCategory } from "@/src/lib/treasuries/types";
import { TreasuryActivationPanel } from "./treasury-activation-panel";

const defaultCategories: BudgetSetupFields["categories"] = [
  { name: "Venue", allocation: "500.00" },
  { name: "Catering", allocation: "300.00" },
  { name: "Marketing", allocation: "200.00" },
];

export function BudgetBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTreasuryId = searchParams.get("treasury");
  const live = publicConfig.claimDataMode === "live";
  const sessionTreasury = useDemoSessionValue(
    demoTreasuryStorageKey,
    treasurySchema,
  );
  const mockTreasury = sessionTreasury ?? demoTreasury;
  const [persistedTreasury, setPersistedTreasury] =
    useState<PersistedTreasuryWorkspace | null>(null);
  const [loadingTreasury, setLoadingTreasury] = useState(live);
  const [budgetInstruction, setBudgetInstruction] = useState("");
  const [budgetDraftResponse, setBudgetDraftResponse] =
    useState<BudgetDraftResponse | null>(null);
  const [generatingBudget, setGeneratingBudget] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<BudgetSetupFields>({
    defaultValues: { categories: defaultCategories },
  });
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "categories",
  });

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    async function loadTreasury() {
      setLoadingTreasury(true);
      clearErrors("root");
      try {
        if (!requestedTreasuryId) {
          throw new Error(
            "Choose a persisted treasury before building its budget.",
          );
        }
        const response = await fetch("/api/treasuries", { cache: "no-store" });
        const result = (await response.json()) as {
          treasuries?: PersistedTreasuryWorkspace[];
          error?: string;
        };
        const selected = result.treasuries?.find(
          (treasury) => treasury.id === requestedTreasuryId,
        );
        if (!response.ok || !selected) {
          throw new Error(
            result.error ?? "The selected treasury is not accessible.",
          );
        }
        if (!cancelled) setPersistedTreasury(selected);
      } catch (error) {
        if (!cancelled) {
          setPersistedTreasury(null);
          setError("root", {
            type: "load",
            message:
              error instanceof Error
                ? error.message
                : "The selected treasury could not be loaded.",
          });
        }
      } finally {
        if (!cancelled) setLoadingTreasury(false);
      }
    }
    void loadTreasury();
    return () => {
      cancelled = true;
    };
  }, [clearErrors, live, requestedTreasuryId, setError]);

  const treasury = live
    ? {
        id: persistedTreasury?.id ?? "unavailable",
        name: persistedTreasury?.name ?? "Treasury unavailable",
        currency: "USDC" as const,
        totalBudgetMinor: asMinorAmount(
          persistedTreasury?.totalBudgetMinor ?? 0,
        ),
        status: "draft" as const,
      }
    : mockTreasury;
  const budgetLocked = Boolean(
    live &&
      persistedTreasury &&
      (persistedTreasury.budgetLockedAt != null ||
        (persistedTreasury.suiActivationStatus !== undefined &&
          persistedTreasury.suiActivationStatus !== "not_started")),
  );
  const watchedCategories = useWatch({ control, name: "categories" });
  const categories = useMemo(
    () => watchedCategories ?? [],
    [watchedCategories],
  );
  const preview = useMemo(
    () => inspectAllocations(treasury.totalBudgetMinor, categories),
    [categories, treasury.totalBudgetMinor],
  );

  async function generateBudgetDraft() {
    if (!live || budgetLocked || !budgetInstruction.trim()) return;
    setGeneratingBudget(true);
    setGenerationError(null);
    setBudgetDraftResponse(null);
    try {
      const response = await fetch("/api/ai/budget-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction: budgetInstruction.trim() }),
      });
      const result = (await response.json()) as BudgetDraftResponse & {
        error?: string;
      };
      if (!response.ok || !result.draft || !result.provenance) {
        throw new Error(result.error ?? "Gemini could not generate a budget draft.");
      }
      replace(
        result.draft.categories.map((category) => ({
          name: category.name,
          allocation: (category.amountMinor / 100).toFixed(2),
        })),
      );
      setBudgetDraftResponse(result);
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : "Gemini could not generate a budget draft.",
      );
    } finally {
      setGeneratingBudget(false);
    }
  }

  const confirmBudget = async (values: BudgetSetupFields) => {
    clearErrors("root");
    try {
      const budget = buildDemoBudget(treasury, values);
      if (live) {
        if (!persistedTreasury || !requestedTreasuryId) {
          throw new Error("Choose an accessible persisted treasury first.");
        }
        const response = await fetch(
          `/api/treasuries/${requestedTreasuryId}/budget`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              categories: values.categories.map((category) => ({
                name: category.name.trim(),
                allocationMinor: parseUsdcDisplay(category.allocation),
              })),
            }),
          },
        );
        const result = (await response.json()) as {
          categories?: PersistedBudgetCategory[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? "The budget could not be saved.");
        }
        setPersistedTreasury({
          ...persistedTreasury,
          categories: result.categories ?? persistedTreasury.categories,
        });
        return;
      }
      writeDemoSessionValue(demoBudgetStorageKey, budget);
      removeDemoSessionValue(demoClaimStorageKey);
      removeDemoSessionValue(demoDecisionStorageKey);
      router.push("/dashboard/claims/new");
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          const [root, index, field] = issue.path;
          if (
            root === "categories" &&
            typeof index === "number" &&
            (field === "name" || field === "allocation")
          ) {
            setError(`categories.${index}.${field}`, {
              type: "validation",
              message: issue.message,
            });
          } else {
            setError("root", {
              type: "validation",
              message: issue.message,
            });
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
              ? "The budget could not be saved."
              : "The sample budget could not be confirmed.",
      });
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
      <form
        className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(24,49,43,0.05)] sm:p-8"
        noValidate
        onSubmit={handleSubmit(confirmBudget)}
      >
        {budgetLocked && (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            Budget locked · Sui activation in progress or active
          </p>
        )}
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--brand)]">
              Category allocations
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
              Divide the treasury safely
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Edit categories until every minor unit is allocated exactly once.
            </p>
          </div>
          <span className="w-fit rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-[var(--muted)]">
            Total · {formatUsdcMinor(treasury.totalBudgetMinor)}
          </span>
        </div>

        {live && (
          <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-700">
              Gemini budget assistant
            </p>
            <h3 className="mt-2 text-lg font-bold">Turn natural language into an editable draft</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Gemini proposes categories only. Deterministic totals still validate the draft and you must confirm it manually.
            </p>
            <label
              className="mt-4 block text-sm font-bold"
              htmlFor="budgetInstruction"
            >
              Describe your budget
            </label>
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              id="budgetInstruction"
              maxLength={4_000}
              placeholder="e.g. I have 10 USDC: 4 for food, 3 for marketing, 2 for transport and 1 for miscellaneous."
              value={budgetInstruction}
              onChange={(event) => setBudgetInstruction(event.target.value)}
              disabled={budgetLocked || generatingBudget}
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={generateBudgetDraft}
                disabled={
                  budgetLocked || generatingBudget || !budgetInstruction.trim()
                }
              >
                {generatingBudget ? "Generating…" : "Generate with Gemini"}
              </button>
              <SystemBoundaryBadges boundaries={["ai", "rules", "human"]} />
            </div>
            {generationError && (
              <p
                className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                role="alert"
              >
                {generationError}
              </p>
            )}
            {budgetDraftResponse && (
              <div className="mt-4 space-y-3">
                <AIProvenanceCard provenance={budgetDraftResponse.provenance} />
                {budgetDraftResponse.draft.notes.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    <p className="font-bold">Gemini notes</p>
                    <ul className="mt-2 space-y-1">
                      {budgetDraftResponse.draft.notes.map((note) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <div className="mt-6 space-y-4">
          {fields.map((field, index) => (
            <fieldset
              className="rounded-2xl border border-[var(--line)] bg-slate-50/55 p-4"
              key={field.id}
            >
              <legend className="sr-only">Budget category {index + 1}</legend>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-start">
                <div>
                  <label
                    className="text-xs font-bold text-[var(--muted)]"
                    htmlFor={`category-${index}-name`}
                  >
                    Category name
                  </label>
                  <input
                    aria-invalid={Boolean(errors.categories?.[index]?.name)}
                    className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-emerald-100"
                    id={`category-${index}-name`}
                    placeholder="e.g. Catering"
                    disabled={budgetLocked}
                    {...register(`categories.${index}.name`)}
                  />
                  {errors.categories?.[index]?.name && (
                    <p
                      className="mt-2 text-xs font-semibold text-rose-700"
                      role="alert"
                    >
                      {errors.categories[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="text-xs font-bold text-[var(--muted)]"
                    htmlFor={`category-${index}-allocation`}
                  >
                    Allocation
                  </label>
                  <div className="relative mt-2">
                    <input
                      aria-invalid={Boolean(
                        errors.categories?.[index]?.allocation,
                      )}
                      className="w-full rounded-xl border border-[var(--line)] bg-white py-3 pl-4 pr-16 text-sm outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-emerald-100"
                      id={`category-${index}-allocation`}
                      inputMode="decimal"
                      disabled={budgetLocked}
                      {...register(`categories.${index}.allocation`)}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-[var(--muted)]">
                      USDC
                    </span>
                  </div>
                  {errors.categories?.[index]?.allocation && (
                    <p
                      className="mt-2 text-xs font-semibold text-rose-700"
                      role="alert"
                    >
                      {errors.categories[index]?.allocation?.message}
                    </p>
                  )}
                </div>
                <button
                  aria-label={`Remove category ${index + 1}`}
                  className="mt-6 rounded-lg px-3 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={budgetLocked || fields.length === 1}
                  onClick={() => remove(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </fieldset>
          ))}
        </div>

        <button
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--brand)]/40 px-4 py-3 text-sm font-bold text-[var(--brand)] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={budgetLocked || fields.length >= 8}
          onClick={() => append({ name: "", allocation: "" })}
          type="button"
        >
          <span aria-hidden="true">＋</span> Add category
        </button>

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
            className="rounded-xl px-4 py-3 text-center text-sm font-bold text-[var(--muted)] transition hover:bg-slate-100"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(29,91,79,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              !preview.canConfirm ||
              isSubmitting ||
              loadingTreasury ||
              budgetLocked ||
              (live && !persistedTreasury)
            }
            type="submit"
          >
            {live ? "Confirm budget" : "Confirm sample budget"}
            <Icon className="size-4" name="arrow" />
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        {live && persistedTreasury && persistedTreasury.categories.length > 0 && (
          <TreasuryActivationPanel workspace={persistedTreasury} />
        )}
        <section className="rounded-3xl bg-[var(--brand)] p-6 text-white shadow-[0_18px_50px_rgba(24,72,63,0.18)] sm:p-7">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
              <Icon className="size-5" name="grid" />
            </span>
            <StatusPill status={preview.status} />
          </div>
          <p className="mt-7 text-xs text-white/55">Editable preview</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
            {treasury.name}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 border-y border-white/10 py-5">
            <div>
              <p className="text-[11px] text-white/50">Allocated</p>
              <p className="mt-1 text-lg font-bold">
                {formatUsdcMinor(preview.allocatedMinor)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/50">
                {preview.status === "over_allocated"
                  ? "Over by"
                  : "Unallocated"}
              </p>
              <p className="mt-1 text-lg font-bold">
                {formatUsdcMinor(preview.differenceMinor)}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {categories.map((category, index) => (
              <div
                className="flex items-center justify-between gap-3 text-sm"
                key={`${index}-${category.name}`}
              >
                <span className="truncate text-white/68">
                  {category.name.trim() || `Category ${index + 1}`}
                </span>
                <span className="shrink-0 font-bold">
                  {formatPreviewAllocation(category.allocation)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
            <Icon className="size-4" name="shield" /> Deterministic rule
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-950/70">
            Confirmation unlocks only when valid category allocations equal the
            treasury total exactly. No AI decides the arithmetic.
          </p>
        </section>
      </aside>
    </div>
  );
}

function inspectAllocations(
  totalMinor: MinorAmount,
  categories: BudgetSetupFields["categories"],
) {
  const parsed = categories.map((category) => {
    try {
      const amount = parseUsdcDisplay(category.allocation);
      return amount > 0 ? amount : null;
    } catch {
      return null;
    }
  });
  const validAmounts = parsed.filter(
    (amount): amount is MinorAmount => amount !== null,
  );
  const allocatedMinor = addMinorAmounts(...validAmounts);
  const allValid =
    categories.length > 0 && validAmounts.length === categories.length;
  const check = checkBudgetTotal(totalMinor, validAmounts);

  return {
    allocatedMinor,
    differenceMinor: allValid ? check.differenceMinor : asMinorAmount(0),
    status: allValid ? check.status : ("incomplete" as const),
    canConfirm: allValid && check.isBalanced,
  };
}

function formatPreviewAllocation(value: string): string {
  try {
    return formatUsdcMinor(parseUsdcDisplay(value));
  } catch {
    return "—";
  }
}

function StatusPill({
  status,
}: {
  status: "incomplete" | "balanced" | "under_allocated" | "over_allocated";
}) {
  const labels = {
    incomplete: "Complete fields",
    balanced: "Balanced",
    under_allocated: "Under allocated",
    over_allocated: "Over allocated",
  } as const;

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${status === "balanced" ? "bg-[var(--accent)] text-[var(--brand-deep)]" : status === "over_allocated" ? "bg-rose-400/20 text-rose-100" : "border border-white/15 text-white/65"}`}
    >
      {labels[status]}
    </span>
  );
}
