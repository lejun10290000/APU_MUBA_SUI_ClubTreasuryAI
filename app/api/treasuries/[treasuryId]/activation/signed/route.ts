import { isValidTransactionDigest } from "@mysten/sui/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import { createServerSupabaseClient, requireSupabaseUserId } from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";
import { recordSignedActivationStep } from "@/src/lib/treasuries/activation-repository";

const paramsSchema = z.object({ treasuryId: z.string().uuid() });
const bodySchema = z.object({
  step: z.enum(["create", "fund", "allocation"]),
  digest: z.string().refine(isValidTransactionDigest, "Invalid Sui transaction digest."),
});

export async function POST(request: Request, context: { params: Promise<{ treasuryId: string }> }) {
  try {
    const { treasuryId } = paramsSchema.parse(await context.params);
    const input = bodySchema.parse(await request.json());
    const sessionClient = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(sessionClient);
    const adminClient = createAdminSupabaseClient();
    const identity = await resolveVerifiedWalletIdentity({ sessionUserId, adminClient });
    const activation = await recordSignedActivationStep({
      client: adminClient,
      treasuryId,
      ownerUserId: identity.userId,
      ...input,
    });
    return NextResponse.json({ activation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signed activation digest could not be saved.";
    return NextResponse.json(
      { error: message },
      { status: /already|reconcile/i.test(message) ? 409 : 400 },
    );
  }
}
