"use client";

import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { ZodError } from "zod";
import { publicConfig } from "@/src/config/env";
import {
  claimSubmissionInputSchema,
  demoBudgetStorageKey,
} from "@/src/domain/demo-workflow";
import { formatUsdcMinor, parseUsdcDisplay } from "@/src/domain/money";
import { demoSuiAddress } from "@/src/domain/stage5-claims";
import { budgetSchema, treasurySchema } from "@/src/domain/schemas";
import { demoTreasuryStorageKey } from "@/src/domain/treasury-setup";
import { demoBudget, demoTreasury } from "@/src/data/mock-dashboard";
import { ensureWalletIdentity } from "@/src/lib/sui/wallet-identity";
import { Icon } from "./icon";
import { useDemoSessionValue } from "./use-demo-session";

interface Stage5ClaimFields {
  submitterName: string;
  description: string;
  merchant: string;
  categoryId: string;
  requestedAmount: string;
  receiptAmount: string;
  receiptReference: string;
  treasuryObjectId: string;
  recipientSuiAddress: string;
  receipt: FileList;
}

export function ClaimSubmissionForm() {
  const router = useRouter();
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();
  const [requestReference] = useState(() => crypto.randomUUID());
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
  } = useForm<Stage5ClaimFields>({
    defaultValues: {
      submitterName: "",
      description: "",
      merchant: "",
      categoryId: "",
      requestedAmount: "",
      receiptAmount: "",
      receiptReference: "",
      treasuryObjectId:
        publicConfig.claimDataMode === "mock"
          ? publicConfig.demoTreasuryObjectId
          : "",
      recipientSuiAddress:
        publicConfig.claimDataMode === "mock" ? demoSuiAddress : "",
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

  const submitClaim = async (values: Stage5ClaimFields) => {
    try {
      const parsed = claimSubmissionInputSchema.parse(values);
      const receipt = values.receipt?.item(0);
      if (!receipt) {
        setError("receipt", {
          type: "validation",
          message: "Upload the receipt image.",
        });
        return;
      }

      if (publicConfig.claimDataMode === "live") {
        if (!account) {
          throw new Error(
            "Connect the member Sui wallet before submitting a live claim.",
          );
        }
        await ensureWalletIdentity({
          signer: dAppKit,
          walletAddress: account.address,
          displayName: parsed.submitterName,
        });
      }

      const payload = {
        externalReference: requestReference,
        workspace: {
          externalReference: treasury.id,
          name: treasury.name,
          totalBudgetMinor: treasury.totalBudgetMinor,
          treasuryObjectId: values.treasuryObjectId,
          categories: budget.categories.map((category) => ({
            externalReference: category.id,
            name: category.name,
            allocatedMinor: category.allocatedMinor,
            spentMinor: category.spentMinor,
          })),
        },
        categoryExternalReference: parsed.categoryId,
        submitterName: parsed.submitterName,
        merchant: parsed.merchant,
        description: parsed.description,
        requestedAmountMinor: parseUsdcDisplay(parsed.requestedAmount),
        receiptAmountMinor: parsed.receiptAmount
          ? parseUsdcDisplay(parsed.receiptAmount)
          : null,
        receiptReference: parsed.receiptReference || null,
        recipientSuiAddress: values.recipientSuiAddress,
        currency: "USDC",
      };
      const formData = new FormData();
      formData.set("payload", JSON.stringify(payload));
      formData.set("receipt", receipt);
      const response = await fetch("/api/claims", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        claim?: { id: string };
        error?: string;
      };
      if (!response.ok || !result.claim) {
        throw new Error(result.error ?? "The claim could not be submitted.");
      }
      router.push(`/dashboard/claims/review?claim=${result.claim.id}`);
    } catch (error) {
      if (error instanceof ZodError) {
        for (const issue of error.issues) {
          const field = issue.path[0];
          if (typeof field === "string" && field in values) {
            setError(field as keyof Stage5ClaimFields, {
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
            : "The claim could not be submitted.",
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
              Stage 5 member request
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em]">
              Submit the claim and receipt
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              The receipt is validated, hashed, privately stored, analysed once,
              and checked by deterministic rules.
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
              className={inputClass}
              id="submitterName"
              {...register("submitterName")}
            />
          </Field>
          <Field
            error={errors.merchant?.message}
            id="merchant"
            label="Merchant"
          >
            <input
              className={inputClass}
              id="merchant"
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
                className={`${inputClass} min-h-24 resize-y`}
                id="description"
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
              register={register("requestedAmount")}
            />
          </Field>
          <Field
            error={errors.receiptAmount?.message}
            hint="Optional typed fallback; AI reads the uploaded image."
            id="receiptAmount"
            label="Receipt amount"
          >
            <MoneyInput
              id="receiptAmount"
              register={register("receiptAmount")}
            />
          </Field>
          <Field
            error={errors.receiptReference?.message}
            hint="Optional invoice or receipt number."
            id="receiptReference"
            label="Receipt reference"
          >
            <input
              className={inputClass}
              id="receiptReference"
              {...register("receiptReference")}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              error={errors.treasuryObjectId?.message}
              hint="Select the real persisted treasury relationship. The demo ID is prefilled only in mock mode."
              id="treasuryObjectId"
              label="Treasury Sui object ID"
            >
              <input
                className={`${inputClass} font-mono text-xs`}
                id="treasuryObjectId"
                {...register("treasuryObjectId", {
                  required: "Enter the Sui treasury object ID.",
                })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              error={errors.recipientSuiAddress?.message}
              hint="Immutable payout destination if a treasurer approves. No payment occurs in Stage 5."
              id="recipientSuiAddress"
              label="Recipient Sui address"
            >
              <input
                className={`${inputClass} font-mono text-xs`}
                id="recipientSuiAddress"
                {...register("recipientSuiAddress", {
                  required: "Enter the recipient Sui address.",
                })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              error={errors.receipt?.message}
              hint="JPEG, PNG, or WebP · maximum 10 MB · immutable after submission"
              id="receipt"
              label="Receipt image"
            >
              <input
                accept="image/jpeg,image/png,image/webp"
                className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-emerald-800`}
                id="receipt"
                type="file"
                {...register("receipt", {
                  required: "Upload the receipt image.",
                })}
              />
            </Field>
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
            className="rounded-xl px-4 py-3 text-center text-sm font-bold text-[var(--muted)] transition hover:bg-slate-100"
            href="/dashboard/budget"
          >
            Back to budget
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(29,91,79,0.18)] disabled:cursor-wait disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Securing and analysing…"
              : "Submit claim for review"}
            <Icon className="size-4" name="arrow" />
          </button>
        </div>
      </form>

      <aside className="space-y-5">
        <section className="rounded-3xl bg-[var(--brand)] p-6 text-white shadow-[0_18px_50px_rgba(24,72,63,0.18)] sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
            Claim preview
          </p>
          <p className="mt-5 text-xs text-white/55">Requested</p>
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
            <Icon className="size-4" name="shield" /> Human boundary
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-950/70">
            AI and rules only recommend. A treasurer decides, and approval
            remains unpaid with no wallet popup or Sui transaction.
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
  register,
}: {
  id: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div className="relative">
      <input
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
  if (!value.trim()) return "—";
  try {
    return formatUsdcMinor(parseUsdcDisplay(value));
  } catch {
    return "Invalid";
  }
}
