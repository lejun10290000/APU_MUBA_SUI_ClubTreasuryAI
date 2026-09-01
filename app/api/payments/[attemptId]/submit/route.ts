import { NextResponse } from "next/server";
import { z } from "zod";
import { getClaimRepository } from "@/src/lib/claims";
import {
  recordSignedPaymentSubmission,
  signedPaymentSubmissionSchema,
} from "@/src/lib/payments/contracts";

const paramsSchema = z.object({ attemptId: z.string().uuid() });

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = paramsSchema.parse(await context.params);
    const input = signedPaymentSubmissionSchema.parse(await request.json());
    const attempt = await recordSignedPaymentSubmission(
      await getClaimRepository(),
      attemptId,
      input,
    );
    return NextResponse.json({ attempt });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Signed payment evidence could not be saved.",
      },
      { status: 400 },
    );
  }
}

