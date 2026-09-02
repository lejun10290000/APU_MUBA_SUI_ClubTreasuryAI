import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaimRepository } from "@/src/lib/claims";
import { prepareClaimPayment } from "@/src/lib/payments/contracts";

const paramsSchema = z.object({ claimId: z.string().uuid() });

export async function POST(
  _request: Request,
  context: { params: Promise<{ claimId: string }> },
) {
  try {
    const { claimId } = paramsSchema.parse(await context.params);
    const result = await prepareClaimPayment(
      await getClaimRepository(),
      claimId,
    );
    return NextResponse.json(result);
  } catch (error) {
    return paymentErrorResponse(error, "The payment attempt could not be prepared.");
  }
}

function paymentErrorResponse(error: unknown, fallback: string) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: 400 },
  );
}

