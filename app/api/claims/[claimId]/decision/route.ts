import { NextResponse } from "next/server";
import { z } from "zod";
import { claimDecisionInputSchema } from "@/src/domain/stage5-claims";
import { getClaimRepository } from "@/src/lib/claims";

const paramsSchema = z.object({ claimId: z.string().uuid() });

export async function POST(
  request: Request,
  context: { params: Promise<{ claimId: string }> },
) {
  try {
    const { claimId } = paramsSchema.parse(await context.params);
    const { decision, reason } = claimDecisionInputSchema.parse(
      await request.json(),
    );
    const claim = await (
      await getClaimRepository()
    ).decideClaim(claimId, decision, reason);
    return NextResponse.json({ claim });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The human decision could not be saved.",
      },
      { status: 400 },
    );
  }
}
