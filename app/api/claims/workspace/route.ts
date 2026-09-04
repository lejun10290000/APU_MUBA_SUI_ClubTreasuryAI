import { NextResponse } from "next/server";
import { z } from "zod";
import { mapLiveClaimWorkspace } from "@/src/lib/claims/live-workspace";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";

const querySchema = z.object({
  treasuryId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { treasuryId } = querySchema.parse({
      treasuryId: url.searchParams.get("treasuryId"),
    });
    const client = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(client);
    const identity = await resolveVerifiedWalletIdentity({
      sessionUserId,
      adminClient: createAdminSupabaseClient(),
    });

    const { data: treasury, error: treasuryError } = await client
      .from("treasuries")
      .select(
        "id,owner_user_id,external_reference,name,total_budget_minor,sui_treasury_object_id,status",
      )
      .eq("id", treasuryId)
      .eq("status", "active")
      .maybeSingle();
    if (treasuryError) throw treasuryError;
    if (!treasury) throw new Error("The selected treasury was not found.");

    const { data: membership, error: membershipError } = await client
      .from("treasury_members")
      .select("role")
      .eq("treasury_id", treasury.id)
      .eq("user_id", identity.userId)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (treasury.owner_user_id !== identity.userId && !membership) {
      throw new Error("Treasury membership is required to submit this claim.");
    }

    const { data: categories, error: categoriesError } = await client
      .from("budget_categories")
      .select("external_reference,name,allocated_minor,spent_minor")
      .eq("treasury_id", treasury.id)
      .order("created_at", { ascending: true });
    if (categoriesError) throw categoriesError;
    if (!categories.length) {
      throw new Error("The live treasury has no budget categories.");
    }

    return NextResponse.json({
      workspace: mapLiveClaimWorkspace(treasury, categories),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The live treasury workspace could not be loaded.",
      },
      { status: 400 },
    );
  }
}
