import type { TreasurySuiActivationRow } from "@/src/lib/supabase/database.types";

export type ActivationStep = "create" | "fund" | "allocation";

export type ActivationStepStatus =
  | "not_started"
  | "signed"
  | "submitted"
  | "confirmed"
  | "reconciliation_required"
  | "failed_before_signing";

export type TreasuryActivationStatus =
  | "not_started"
  | "in_progress"
  | "reconciliation_required"
  | "active";

export type TreasurySuiActivation = {
  treasuryId: string;
  ownerWalletAddress: string;
  status: TreasuryActivationStatus;
  createStatus: ActivationStepStatus;
  createDigest: string | null;
  createConfirmedAt: string | null;
  fundStatus: ActivationStepStatus;
  fundDigest: string | null;
  fundConfirmedAt: string | null;
  allocationStatus: ActivationStepStatus;
  allocationDigest: string | null;
  allocationConfirmedAt: string | null;
  activatedAt: string | null;
};

export function mapTreasurySuiActivation(
  row: TreasurySuiActivationRow,
): TreasurySuiActivation {
  return {
    treasuryId: row.treasury_id,
    ownerWalletAddress: row.owner_wallet_address,
    status: row.status,
    createStatus: row.create_status,
    createDigest: row.create_digest,
    createConfirmedAt: row.create_confirmed_at,
    fundStatus: row.fund_status,
    fundDigest: row.fund_digest,
    fundConfirmedAt: row.fund_confirmed_at,
    allocationStatus: row.allocation_status,
    allocationDigest: row.allocation_digest,
    allocationConfirmedAt: row.allocation_confirmed_at,
    activatedAt: row.activated_at,
  };
}
