"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Icon } from "./icon";
import { formatUsdcMinor } from "@/src/domain/money";
import { treasurySchema, type Treasury } from "@/src/domain/schemas";
import { demoTreasuryStorageKey } from "@/src/domain/treasury-setup";

export function DemoTreasuryNotice() {
  const storedTreasury = useSyncExternalStore(
    subscribeToTreasuryPreview,
    getTreasuryPreviewSnapshot,
    () => null,
  );
  const treasury = useMemo(
    () => parseStoredTreasury(storedTreasury),
    [storedTreasury],
  );

  if (!treasury) {
    return null;
  }

  const dismiss = () => {
    window.sessionStorage.removeItem(demoTreasuryStorageKey);
    window.dispatchEvent(new Event("clubtreasury:preview-changed"));
  };

  return (
    <section
      aria-label="Demo treasury created"
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
          <Icon className="size-5" name="check" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-emerald-950">
            Demo treasury preview created
          </h2>
          <p className="mt-1 text-sm text-emerald-900/70">
            <strong>{treasury.name}</strong> ·{" "}
            {formatUsdcMinor(treasury.totalBudgetMinor)}
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/60">
            Session-only preview. The fixture dashboard below is unchanged; no
            record or on-chain treasury was created.
          </p>
        </div>
      </div>
      <button
        className="self-start rounded-lg px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 sm:self-center"
        onClick={dismiss}
        type="button"
      >
        Dismiss
      </button>
    </section>
  );
}

function subscribeToTreasuryPreview(callback: () => void) {
  window.addEventListener("clubtreasury:preview-changed", callback);
  return () =>
    window.removeEventListener("clubtreasury:preview-changed", callback);
}

function getTreasuryPreviewSnapshot() {
  return window.sessionStorage.getItem(demoTreasuryStorageKey);
}

function parseStoredTreasury(storedTreasury: string | null): Treasury | null {
  if (!storedTreasury) {
    return null;
  }

  try {
    const result = treasurySchema.safeParse(JSON.parse(storedTreasury));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
