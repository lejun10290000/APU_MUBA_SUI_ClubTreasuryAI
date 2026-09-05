import { NextResponse } from "next/server";
import { z } from "zod";

import { serverConfig } from "@/src/config/env";
import { appMinorToUsdcBaseUnits } from "@/src/lib/sui/payment-safety";
import { readActivationTransaction, readActivationTreasury, verifyActivationTreasurerCap } from "@/src/lib/sui/activation-server";
import {
  ActivationExecutionFailedError,
  verifyAllocationActivation,
  verifyCreateActivation,
  verifyCreatedTreasuryState,
  verifyFundActivation,
} from "@/src/lib/sui/activation-verification";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { createServerSupabaseClient, requireSupabaseUserId } from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";
import { loadTreasuryActivation, persistActivationReconciliation } from "@/src/lib/treasuries/activation-repository";

const paramsSchema = z.object({ treasuryId: z.string().uuid() });
const bodySchema = z.object({ step: z.enum(["create", "fund", "allocation"]) });

export async function POST(request: Request, context: { params: Promise<{ treasuryId: string }> }) {
  const { treasuryId } = paramsSchema.parse(await context.params);
  let reconciliationContext:
    | {
        adminClient: ReturnType<typeof createAdminSupabaseClient>;
        ownerUserId: string;
        step: "create" | "fund" | "allocation";
        digest: string;
      }
    | undefined;
  try {
    const { step } = bodySchema.parse(await request.json());
    const sessionClient = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(sessionClient);
    const adminClient = createAdminSupabaseClient();
    const identity = await resolveVerifiedWalletIdentity({ sessionUserId, adminClient });
    const activation = await loadTreasuryActivation(adminClient, treasuryId);
    if (!activation || activation.ownerWalletAddress !== identity.walletAddress) {
      return NextResponse.json({ error: "Verified treasury owner required." }, { status: 403 });
    }
    const digest = step === "create" ? activation.createDigest : step === "fund" ? activation.fundDigest : activation.allocationDigest;
    if (!digest) throw new Error("No saved digest exists for this activation step.");
    reconciliationContext = {
      adminClient,
      ownerUserId: identity.userId,
      step,
      digest,
    };
    const packageId = serverConfig.NEXT_PUBLIC_SUI_PACKAGE_ID;
    if (!packageId) throw new Error("The Sui Testnet package ID is not configured.");
    const transaction = await readActivationTransaction(digest);
    const common = {
      digest,
      ownerWalletAddress: identity.walletAddress,
      packageId,
      coinType: serverConfig.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
    };
    const { data: workspace, error: workspaceError } = await adminClient
      .from("treasuries")
      .select("total_budget_minor,external_reference")
      .eq("id", treasuryId)
      .single();
    if (workspaceError) throw workspaceError;
    let created: { treasuryObjectId?: string; treasurerCapObjectId?: string } = {};
    if (step === "create") {
      created = verifyCreateActivation(transaction, common);
      const treasury = await readActivationTreasury(created.treasuryObjectId!);
      verifyCreatedTreasuryState(treasury, {
        treasuryObjectId: created.treasuryObjectId!,
        ownerWalletAddress: identity.walletAddress,
        externalReference: workspace.external_reference,
      });
      await verifyActivationTreasurerCap({
        capObjectId: created.treasurerCapObjectId!,
        ownerWalletAddress: identity.walletAddress,
        treasuryObjectId: created.treasuryObjectId!,
      });
    } else {
      if (!activation.treasuryObjectId) throw new Error("Verified Create Treasury is missing.");
      const treasury = await readActivationTreasury(activation.treasuryObjectId);
      if (step === "fund") {
        verifyFundActivation(transaction, {
          ...common,
          expectedBudgetAtomic: appMinorToUsdcBaseUnits(workspace.total_budget_minor),
          treasuryObjectId: activation.treasuryObjectId,
          treasury,
        });
      } else {
        const { data: categories, error: categoryError } = await adminClient
          .from("budget_categories")
          .select("external_reference,allocated_minor")
          .eq("treasury_id", treasuryId)
          .order("created_at", { ascending: true });
        if (categoryError) throw categoryError;
        verifyAllocationActivation(transaction, {
          ...common,
          treasury,
          treasuryObjectId: activation.treasuryObjectId,
          treasurerCapObjectId: activation.treasurerCapObjectId ?? undefined,
          expectedCategories: categories.map((category) => ({
            reference: category.external_reference,
            allocatedAtomic: appMinorToUsdcBaseUnits(category.allocated_minor),
          })),
        });
      }
    }
    const reconciled = await persistActivationReconciliation({
      client: adminClient,
      treasuryId,
      ownerUserId: identity.userId,
      step,
      digest,
      outcome: "confirmed",
      ...created,
    });
    return NextResponse.json({ activation: reconciled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation could not be reconciled.";
    if (reconciliationContext) {
      if (error instanceof ActivationExecutionFailedError) {
        try {
          const activation = await persistActivationReconciliation({
            client: reconciliationContext.adminClient,
            treasuryId,
            ownerUserId: reconciliationContext.ownerUserId,
            step: reconciliationContext.step,
            digest: reconciliationContext.digest,
            outcome: "failed",
          });
          return NextResponse.json(
            {
              error: message,
              transactionFailed: true,
              activation,
            },
            { status: 409 },
          );
        } catch {
          return NextResponse.json(
            { error: message, transactionFailed: true },
            { status: 409 },
          );
        }
      }
      try {
        const activation = await persistActivationReconciliation({
          client: reconciliationContext.adminClient,
          treasuryId,
          ownerUserId: reconciliationContext.ownerUserId,
          step: reconciliationContext.step,
          digest: reconciliationContext.digest,
          outcome: "reconciliation_required",
        });
        return NextResponse.json(
          { error: message, reconciliationRequired: true, activation },
          { status: 409 },
        );
      } catch {
        return NextResponse.json(
          { error: message, reconciliationRequired: true },
          { status: 409 },
        );
      }
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
