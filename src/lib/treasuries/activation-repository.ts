import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, TreasurySuiActivationRow } from "@/src/lib/supabase/database.types";
import {
  mapTreasurySuiActivation,
  type ActivationStep,
  type TreasurySuiActivation,
} from "@/src/lib/treasuries/activation-types";

type ActivationClient = SupabaseClient<Database>;

function stepState(activation: TreasurySuiActivation, step: ActivationStep) {
  if (step === "create") {
    return { status: activation.createStatus, digest: activation.createDigest };
  }
  if (step === "fund") {
    return { status: activation.fundStatus, digest: activation.fundDigest };
  }
  return {
    status: activation.allocationStatus,
    digest: activation.allocationDigest,
  };
}

export function nextActivationStep(
  activation: TreasurySuiActivation,
): ActivationStep | "reconcile" | "complete" {
  if (activation.status === "active") return "complete";
  for (const step of ["create", "fund", "allocation"] as const) {
    const state = stepState(activation, step);
    if (state.status === "reconciliation_required" || state.digest) {
      if (state.status !== "confirmed") return "reconcile";
    }
    if (state.status !== "confirmed") return step;
  }
  return "complete";
}

export function assertCanRecordSignedActivationStep(
  activation: TreasurySuiActivation,
  step: ActivationStep,
  digest: string,
): void {
  const state = stepState(activation, step);
  if (state.status === "confirmed") {
    throw new Error(`${step} is already confirmed and cannot be signed again.`);
  }
  if (state.digest && state.digest !== digest) {
    throw new Error(
      `Reconcile existing ${step} digest ${state.digest} before any replacement transaction.`,
    );
  }
  if (step === "fund" && activation.createStatus !== "confirmed") {
    throw new Error("Create must be confirmed before funding.");
  }
  if (step === "allocation" && activation.fundStatus !== "confirmed") {
    throw new Error("Funding must be confirmed before allocations.");
  }
}

export async function loadTreasuryActivation(
  client: ActivationClient,
  treasuryId: string,
): Promise<TreasurySuiActivation | null> {
  const { data, error } = await client
    .from("treasury_sui_activations")
    .select("*")
    .eq("treasury_id", treasuryId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTreasurySuiActivation(data as TreasurySuiActivationRow) : null;
}

export async function startTreasuryActivation({
  client,
  treasuryId,
  ownerUserId,
  ownerWalletAddress,
}: {
  client: ActivationClient;
  treasuryId: string;
  ownerUserId: string;
  ownerWalletAddress: string;
}): Promise<TreasurySuiActivation> {
  const { data, error } = await client.rpc("start_treasury_sui_activation", {
    p_treasury_id: treasuryId,
    p_owner_user_id: ownerUserId,
    p_owner_wallet_address: ownerWalletAddress,
  });
  if (error) throw error;
  return mapTreasurySuiActivation(data as TreasurySuiActivationRow);
}

export async function recordSignedActivationStep({
  client,
  treasuryId,
  ownerUserId,
  step,
  digest,
}: {
  client: ActivationClient;
  treasuryId: string;
  ownerUserId: string;
  step: ActivationStep;
  digest: string;
}): Promise<TreasurySuiActivation> {
  const current = await loadTreasuryActivation(client, treasuryId);
  if (!current) throw new Error("Treasury activation has not started.");
  assertCanRecordSignedActivationStep(current, step, digest);
  const { data, error } = await client.rpc("record_treasury_activation_signed", {
    p_treasury_id: treasuryId,
    p_owner_user_id: ownerUserId,
    p_step: step,
    p_digest: digest,
  });
  if (error) throw error;
  return mapTreasurySuiActivation(data as TreasurySuiActivationRow);
}

export async function persistActivationReconciliation({
  client,
  treasuryId,
  ownerUserId,
  step,
  digest,
  outcome,
  treasuryObjectId,
  treasurerCapObjectId,
}: {
  client: ActivationClient;
  treasuryId: string;
  ownerUserId: string;
  step: ActivationStep;
  digest: string;
  outcome: "confirmed" | "reconciliation_required" | "failed_before_signing";
  treasuryObjectId?: string;
  treasurerCapObjectId?: string;
}): Promise<TreasurySuiActivation> {
  const { data, error } = await client.rpc("reconcile_treasury_activation_step", {
    p_treasury_id: treasuryId,
    p_owner_user_id: ownerUserId,
    p_step: step,
    p_digest: digest,
    p_outcome: outcome,
    p_treasury_object_id: treasuryObjectId ?? null,
    p_treasurer_cap_object_id: treasurerCapObjectId ?? null,
  });
  if (error) throw error;
  return mapTreasurySuiActivation(data as TreasurySuiActivationRow);
}
