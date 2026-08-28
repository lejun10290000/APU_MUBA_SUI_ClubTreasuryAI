"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ZodError } from "zod";
import { Icon } from "./icon";
import {
  removeDemoSessionValue,
  useDemoSessionValue,
  writeDemoSessionValue,
} from "./use-demo-session";
import {
  buildDemoClaimRecord,
  demoBudgetStorageKey,
  demoClaimStorageKey,
  demoDecisionStorageKey,
  type ClaimSubmissionFields,
} from "@/src/domain/demo-workflow";
import { formatUsdcMinor, parseUsdcDisplay } from "@/src/domain/money";
import { budgetSchema, treasurySchema } from "@/src/domain/schemas";
import { demoTreasuryStorageKey } from "@/src/domain/treasury-setup";
import { demoBudget, demoTreasury } from "@/src/data/mock-dashboard";

export function ClaimSubmissionForm() {
  const router = useRouter();
  const sessionTreasury = useDemoSessionValue(
    demoTreasuryStorageKey,
    treasurySchema,
  );
  const sessionBudget = useDemoSessionValue(demoBudgetStorageKey, budgetSchema);
  const treasury = sessionTreasury ?? demoTreasury;
  const budget =
    sessionBudget?.treasuryId === treasury.id ? sessionBudget : demoBudget;
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClaimSubmissionFields>({
    defaultValues: {
      submitterName: "",
      description: "",
      merchant: "",
      categoryId: "",
      requestedAmount: "",
      receiptAmount: "",
      receiptReference: "",
    },
  });
  const [requestedAmount = "", receiptAmount = "", categoryId = ""] = useWatch({
    control,
    name: ["requestedAmount", "receiptAmount", "categoryId"],
  });
  const selectedCategory = budget.categories.find(
    (category) => category.id === categoryId,
  );
  const preview = useMemo(
    () => ({
      requested: formatOptionalAmount(requestedAmount),
      receipt: formatOptionalAmount(receiptAmount),
    }),
    [receiptAmount, requestedAmount],
  );

  const submitClaim = (values: ClaimSubmissionFields) => {
    try {
      const record = buildDemoClaimRecord(treasury, budget, values);
      writeDemoSessionValue(demoClaimStorageKey, record);
      removeDemoSessionValue(demoDecisionStorageKey);
      router.push("/dashboard/claims/review");
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          const field = issue.path[0];
          if (
            field === "submitterName" ||
            field === "description" ||
            field === "merchant" ||
            field === "categoryId" ||
            field === "requestedAmount" ||
            field === "receiptAmount" ||
            field === "receiptReference"
          ) {
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
            : "The demo claim could not be submitted.",
      });
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
      <form
        className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_40px_rgba(24,49,43,0.05)] sm:p-8"
        noValidate
        onSubmit={handleSubmit(submitClaim)}
      >
        <div className="flex items-start gap-4 border-b border-[var(--line)] pb-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
            <Icon className="size-5" name="receipt" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-violet-700">
              Member request
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
              Add the claim and receipt facts
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Receipt fields are typed mock evidence only. No file is uploaded
              or stored.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <Field
            error={errors.submitterName?.message}
            id="submitterName"
            label="Member name"
          >
            <input
              aria-invalid={Boolean(errors.submitterName)}
              className={inputClass}
              id="submitterName"
              placeholder="e.g. Aina Rahman"
              {...register("submitterName")}
            />
          </Field>
          <Field
            error={errors.merchant?.message}
            id="merchant"
            label="Merchant"
          >
            <input
              aria-invalid={Boolean(errors.merchant)}
              className={inputClass}
              id="merchant"
              placeholder="e.g. Campus Print Shop"
              {...register("merchant")}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              error={errors.description?.message}
              id="description"
              label="Expense description"
            >
              <textarea
                aria-invalid={Boolean(errors.description)}
                className={`${inputClass} min-h-24 resize-y`}
                id="description"
                placeholder="What was purchased and why?"
                {...register("description")}
              />
            </Field>
          </div>
          <Field
            error={errors.categoryId?.message}
            id="categoryId"
            label="Budget category"
          >
            <select
              aria-invalid={Boolean(errors.categoryId)}
              className={inputClass}
              id="categoryId"
              {...register("categoryId")}
            >
              <option value="">Choose a category</option>
              {budget.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} · {formatUsdcMinor(category.allocatedMinor)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            error={errors.requestedAmount?.message}
            id="requestedAmount"
            label="Requested amount"
          >
            <MoneyInput
              id="requestedAmount"
              invalid={Boolean(errors.requestedAmount)}
              register={register("requestedAmount")}
            />
          </Field>
          <Field
            error={errors.receiptAmount?.message}
            hint="Optional; leave blank when evidence is incomplete."
            id="receiptAmount"
            label="Receipt amount"
          >
            <MoneyInput
              id="receiptAmount"
              invalid={Boolean(errors.receiptAmount)}
              register={register("receiptAmount")}
            />
          </Field>
          <Field
            error={errors.receiptReference?.message}
            hint="Mock invoice or receipt number used for duplicate checks."
            id="receiptReference"
            label="Receipt reference"
          >
            <input
              aria-invalid={Boolean(errors.receiptReference)}
              className={inputClass}
              id="receiptReference"
              placeholder="e.g. RCP-2026-104"
              {...register("receiptReference")}
            />
          </Field>
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
            className="rounded-xl px-4 py-3 text-center text-sm font-bold text-[var(--muted)] transition hover:bg-slate-100"
            href="/dashboard/budget"
          >
            Back to budget
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(29,91,79,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            Run deterministic review
            <Icon className="size-4" name="arrow" />
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        <section className="rounded-3xl bg-[var(--brand)] p-6 text-white shadow-[0_18px_50px_rgba(24,72,63,0.18)] sm:p-7">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[var(--accent)]">
              <Icon className="size-5" name="receipt" />
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/65">
              Claim preview
            </span>
          </div>
          <p className="mt-7 text-xs text-white/55">Requested</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.04em]">
            {preview.requested}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm">
            <div>
              <p className="text-[11px] text-white/50">Receipt</p>
              <p className="mt-1 font-bold">{preview.receipt}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/50">Category</p>
              <p className="mt-1 truncate font-bold">
                {selectedCategory?.name ?? "Not selected"}
              </p>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
            <Icon className="size-4" name="shield" /> Safety boundary
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-950/70">
            The next screen recommends a result using deterministic rules. A
            human treasurer still makes the final demo decision.
          </p>
        </section>
      </aside>
    </div>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[var(--brand)] focus:ring-4 focus:ring-emerald-100";

function Field({
  children,
  error,
  hint,
  id,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  hint?: string;
  id: string;
  label: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold" htmlFor={id}>
        {label}
      </label>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
      {children}
      {error && (
        <p className="mt-2 text-xs font-semibold text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function MoneyInput({
  id,
  invalid,
  register,
}: {
  id: string;
  invalid: boolean;
  register: ReturnType<
    ReturnType<typeof useForm<ClaimSubmissionFields>>["register"]
  >;
}) {
  return (
    <div className="relative">
      <input
        aria-invalid={invalid}
        className={`${inputClass} pr-16`}
        id={id}
        inputMode="decimal"
        placeholder="0.00"
        {...register}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center pt-2 text-[10px] font-bold text-[var(--muted)]">
        USDC
      </span>
    </div>
  );
}

function formatOptionalAmount(value: string): string {
  if (!value.trim()) {
    return "—";
  }
  try {
    return formatUsdcMinor(parseUsdcDisplay(value));
  } catch {
    return "Invalid";
  }
}
