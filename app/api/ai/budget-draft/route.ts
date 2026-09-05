import { NextResponse } from "next/server";
import { z } from "zod";

import { serverConfig } from "@/src/config/env";
import { getAIService } from "@/src/lib/ai";
import { budgetInstructionSchema } from "@/src/lib/ai/types";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";

const requestSchema = z.object({ instruction: budgetInstructionSchema });

export async function POST(request: Request) {
  try {
    const { instruction } = requestSchema.parse(await request.json());
    const sessionClient = await createServerSupabaseClient();
    const sessionUserId = await requireSupabaseUserId(sessionClient);
    await resolveVerifiedWalletIdentity({
      sessionUserId,
      adminClient: createAdminSupabaseClient(),
    });

    const draft = await getAIService().parseBudget(instruction);
    return NextResponse.json({
      draft,
      provenance: {
        provider: "Google Gemini",
        model: serverConfig.GEMINI_MODEL,
        mode: "live",
        task: "budget_draft",
        generatedAt: new Date().toISOString(),
        humanConfirmationRequired: true,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gemini budget generation failed.";
    const status = /authenticate|verify the connected/i.test(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
