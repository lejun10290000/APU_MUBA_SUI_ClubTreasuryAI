import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaimRepository } from "@/src/lib/claims";
import { reconcilePaymentAttempt } from "@/src/lib/payments/contracts";
import { getPaymentChainStatusProvider } from "@/src/lib/payments/server";

const paramsSchema = z.object({ attemptId: z.string().uuid() });

export async function POST(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = paramsSchema.parse(await context.params);
    const result = await reconcilePaymentAttempt(
      await getClaimRepository(),
      getPaymentChainStatusProvider(),
      attemptId,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payment reconciliation could not be completed.",
      },
      { status: 400 },
    );
  }
}

