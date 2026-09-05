import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { createServerSupabaseClient, requireSupabaseUserId } from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";
import { loadTreasuryActivation, startTreasuryActivation } from "@/src/lib/treasuries/activation-repository";

const paramsSchema = z.object({ treasuryId: z.string().uuid() });
type Context = { params: Promise<{ treasuryId: string }> };

async function identityAndAdmin() {
  const sessionClient = await createServerSupabaseClient();
  const sessionUserId = await requireSupabaseUserId(sessionClient);
  const adminClient = createAdminSupabaseClient();
  const identity = await resolveVerifiedWalletIdentity({ sessionUserId, adminClient });
  return { adminClient, identity };
}

export async function GET(_request: Request, context: Context) {
  try {
    const { treasuryId } = paramsSchema.parse(await context.params);
    const { adminClient, identity } = await identityAndAdmin();
    const { data: treasury, error } = await adminClient
      .from("treasuries")
      .select("id,owner_user_id")
      .eq("id", treasuryId)
      .single();
    if (error) throw error;
    if (treasury.owner_user_id !== identity.userId) {
      return NextResponse.json({ error: "Treasury owner required." }, { status: 403 });
    }
    return NextResponse.json({
      activation: await loadTreasuryActivation(adminClient, treasuryId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Activation could not be loaded." },
      { status: 400 },
    );
  }
}

export async function POST(_request: Request, context: Context) {
  try {
    const { treasuryId } = paramsSchema.parse(await context.params);
    const { adminClient, identity } = await identityAndAdmin();
    const activation = await startTreasuryActivation({
      client: adminClient,
      treasuryId,
      ownerUserId: identity.userId,
      ownerWalletAddress: identity.walletAddress,
    });
    return NextResponse.json({ activation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation could not start.";
    return NextResponse.json(
      { error: message },
      { status: /owner required/i.test(message) ? 403 : /already|locked/i.test(message) ? 409 : 400 },
    );
  }
}
