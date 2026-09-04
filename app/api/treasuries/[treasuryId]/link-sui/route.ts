import { SuiGrpcClient } from "@mysten/sui/grpc";
import { isValidSuiObjectId, normalizeSuiObjectId } from "@mysten/sui/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

import { publicConfig } from "@/src/config/public-env";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import type { TreasuryRow } from "@/src/lib/supabase/database.types";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";
import { verifyTreasurerCap } from "@/src/lib/sui/treasurer-cap-verification";
import { mapPersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";

const objectIdSchema = z
  .string()
  .trim()
  .refine(isValidSuiObjectId, "Enter a valid Sui object ID.")
  .transform((value) => normalizeSuiObjectId(value));

const linkSchema = z.object({
  treasuryObjectId: objectIdSchema,
  treasurerCapObjectId: objectIdSchema,
});

type RouteContext = { params: Promise<{ treasuryId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { treasuryId } = z
      .object({ treasuryId: z.string().uuid() })
      .parse(await context.params);
    const input = linkSchema.parse(await request.json());
    if (!publicConfig.suiPackageId) {
      throw new Error("The Sui Testnet package ID is not configured.");
    }

    const client = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(client);
    const adminClient = createAdminSupabaseClient();
    const identity = await resolveVerifiedWalletIdentity({
      sessionUserId,
      adminClient,
    });
    const { data: treasury, error: treasuryError } = await client
      .from("treasuries")
      .select("*")
      .eq("id", treasuryId)
      .eq("status", "active")
      .single();
    if (treasuryError) throw treasuryError;
    if (treasury.owner_user_id !== identity.userId) {
      return NextResponse.json(
        { error: "Only the treasury owner can link its Sui Treasury." },
        { status: 403 },
      );
    }

    const existingObjectId = treasury.sui_treasury_object_id;
    if (existingObjectId) {
      if (normalizeSuiObjectId(existingObjectId) !== input.treasuryObjectId) {
        return NextResponse.json(
          {
            error:
              "This workspace is already linked to a different Sui Treasury.",
          },
          { status: 409 },
        );
      }
      return NextResponse.json({
        treasury: mapPersistedTreasuryWorkspace({
          treasury: treasury as TreasuryRow,
          categories: [],
          role: "owner",
        }),
      });
    }

    if (
      normalizeSuiObjectId(publicConfig.demoTreasuryObjectId) ===
      input.treasuryObjectId
    ) {
      return NextResponse.json(
        {
          error:
            "A new workspace cannot reuse the Stage 6/7 rehearsal Sui Treasury.",
        },
        { status: 409 },
      );
    }

    const { data: duplicate, error: duplicateError } = await adminClient
      .from("treasuries")
      .select("id")
      .eq("sui_treasury_object_id", input.treasuryObjectId)
      .neq("id", treasuryId)
      .maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) {
      return NextResponse.json(
        { error: "That Sui Treasury is already linked to another workspace." },
        { status: 409 },
      );
    }

    const suiClient = new SuiGrpcClient({
      network: "testnet",
      baseUrl: publicConfig.suiRpcUrl,
    });
    const response = await suiClient.getObject({
      objectId: input.treasuryObjectId,
      include: { json: true },
    });
    const object = response.object;
    if (!object) throw new Error("Sui Treasury object was not found.");
    if (normalizeSuiObjectId(object.objectId) !== input.treasuryObjectId) {
      throw new Error("Sui returned a different Treasury object ID.");
    }
    const expectedType = `${normalizeSuiObjectId(publicConfig.suiPackageId)}::treasury::Treasury<${publicConfig.suiUsdcCoinType}>`;
    if (object.type !== expectedType) {
      throw new Error("Object is not the expected Treasury<USDC> type.");
    }
    const owner = object.owner as
      | { $kind?: string; Shared?: Record<string, unknown> }
      | null
      | undefined;
    if (!owner || (owner.$kind !== "Shared" && !("Shared" in owner))) {
      throw new Error("The Sui Treasury must be a shared object.");
    }

    await verifyTreasurerCap(suiClient, {
      capObjectId: input.treasurerCapObjectId,
      connectedWalletAddress: identity.walletAddress,
      approvedTreasuryObjectId: input.treasuryObjectId,
      packageId: publicConfig.suiPackageId,
      coinType: publicConfig.suiUsdcCoinType,
    });

    const { data: linked, error: updateError } = await client
      .from("treasuries")
      .update({ sui_treasury_object_id: input.treasuryObjectId })
      .eq("id", treasuryId)
      .is("sui_treasury_object_id", null)
      .select("*")
      .single();
    if (updateError) throw updateError;

    return NextResponse.json({
      treasury: mapPersistedTreasuryWorkspace({
        treasury: linked as TreasuryRow,
        categories: [],
        role: "owner",
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The Sui Treasury link failed.";
    const status = /authenticate|verify the connected/i.test(message)
      ? 401
      : /duplicate key|already linked/i.test(message)
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
