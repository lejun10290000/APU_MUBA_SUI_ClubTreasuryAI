"use client";

import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { publicConfig } from "@/src/config/public-env";
import {
  asMinorAmount,
  formatUsdcMinor,
  parseUsdcDisplay,
} from "@/src/domain/money";
import { ensureWalletIdentity } from "@/src/lib/sui/wallet-identity";
import type { LiveClaimWorkspace } from "@/src/lib/claims/live-workspace";

export function LiveClaimSubmissionForm() {
  const router = useRouter();
  const account = useCurrentAccount();
  const dAppKit = useDAppKit();
  const [workspace, setWorkspace] = useState<LiveClaimWorkspace | null>(null);
  const [categoryReference, setCategoryReference] = useState("");
  const [submitterName, setSubmitterName] = useState("Stage6 Demo Member");
  const [merchant, setMerchant] = useState("Stage 6 Acceptance Merchant");
  const [description, setDescription] = useState(
    "Stage 6 live payout acceptance claim",
  );
  const [requestedAmount, setRequestedAmount] = useState("0.10");
  const [receiptReference, setReceiptReference] = useState(() =>
    `STAGE6-${Date.now()}`,
  );
  const [recipient, setRecipient] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const objectId = publicConfig.demoTreasuryObjectId;
        const response = await fetch(
          `/api/claims/workspace?treasuryObjectId=${encodeURIComponent(objectId)}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as {
          workspace?: LiveClaimWorkspace;
          error?: string;
        };
        if (!response.ok || !result.workspace) {
          throw new Error(
            result.error ?? "Live treasury workspace could not be loaded.",
          );
        }
        if (cancelled) return;
        setWorkspace(result.workspace);
        setCategoryReference(
          result.workspace.categories[0]?.externalReference ?? "",
        );
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Live workspace could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useMemo(
    () =>
      workspace?.categories.find(
        (category) => category.externalReference === categoryReference,
      ),
    [categoryReference, workspace],
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace || !selectedCategory) {
      setError("Choose a persisted live treasury category.");
      return;
    }
    if (!account) {
      setError("Connect the member Sui wallet before submitting the live claim.");
      return;
    }
    const payoutRecipient = recipient.trim() || account.address;
    if (!payoutRecipient) {
      setError("Enter a recipient Sui address.");
      return;
    }
    if (!receipt) {
      setError("Upload a receipt image.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await ensureWalletIdentity({
        signer: dAppKit,
        walletAddress: account.address,
        displayName: submitterName,
      });

      const payload = {
        externalReference: crypto.randomUUID(),
        workspace,
        categoryExternalReference: selectedCategory.externalReference,
        submitterName,
        merchant,
        description,
        requestedAmountMinor: parseUsdcDisplay(requestedAmount),
        receiptAmountMinor: parseUsdcDisplay(requestedAmount),
        receiptReference: receiptReference || null,
        recipientSuiAddress: payoutRecipient,
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
        throw new Error(
          result.error ?? "The live claim could not be submitted.",
        );
      }
      router.push(`/dashboard/claims/review?claim=${result.claim.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The live claim could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="rounded-2xl border border-[var(--line)] bg-white p-5 text-sm">
        Loading persisted live treasury…
      </p>
    );
  }

  return (
    <form
      className="rounded-3xl border border-[var(--line)] bg-white p-5 sm:p-8"
      onSubmit={submit}
    >
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        <p className="font-bold">Persisted live treasury</p>
        <p className="mt-1">{workspace?.name ?? "Unavailable"}</p>
        <p className="mt-1 break-all font-mono text-xs">
          {workspace?.treasuryObjectId}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Member name">
          <input
            className={inputClass}
            value={submitterName}
            onChange={(event) => setSubmitterName(event.target.value)}
            required
          />
        </Field>
        <Field label="Merchant">
          <input
            className={inputClass}
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
            required
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Expense description">
            <textarea
              className={`${inputClass} min-h-24`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Budget category">
          <select
            className={inputClass}
            value={categoryReference}
            onChange={(event) => setCategoryReference(event.target.value)}
            required
          >
            <option value="">Choose a category</option>
            {workspace?.categories.map((category) => (
              <option
                key={category.externalReference}
                value={category.externalReference}
              >
                {category.name} ·{" "}
                {formatUsdcMinor(
                  asMinorAmount(
                    category.allocatedMinor - category.spentMinor,
                  ),
                )}{" "}
                remaining
              </option>
            ))}
          </select>
        </Field>
        <Field label="Requested amount">
          <input
            className={inputClass}
            inputMode="decimal"
            value={requestedAmount}
            onChange={(event) => setRequestedAmount(event.target.value)}
            required
          />
        </Field>
        <Field label="Receipt reference">
          <input
            className={inputClass}
            value={receiptReference}
            onChange={(event) => setReceiptReference(event.target.value)}
          />
        </Field>
        <Field label="Recipient Sui address">
          <input
            className={`${inputClass} font-mono text-xs`}
            value={recipient || account?.address || ""}
            onChange={(event) => setRecipient(event.target.value)}
            required
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Receipt image">
            <input
              accept="image/jpeg,image/png,image/webp"
              className={inputClass}
              type="file"
              onChange={(event) =>
                setReceipt(event.target.files?.item(0) ?? null)
              }
              required
            />
          </Field>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <button
        className="mt-6 w-full rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        disabled={submitting || !workspace}
        type="submit"
      >
        {submitting
          ? "Submitting live claim…"
          : "Submit live claim for review"}
      </button>
      <p className="mt-3 text-xs text-[var(--muted)]">
        This form uses persisted Supabase treasury/category values. Payment still
        requires a separate human approval and wallet signature.
      </p>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-bold">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-emerald-100";
