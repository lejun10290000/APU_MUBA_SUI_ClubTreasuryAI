import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { publicConfig } from "@/src/config/public-env";
import { persistedClaimSubmissionSchema } from "@/src/domain/stage5-claims";
import { getClaimAIService } from "@/src/lib/ai";
import { getClaimRepository } from "@/src/lib/claims";
import { submitClaimWorkflow } from "@/src/lib/claims/service";
import { requireMemberClaimSubmission } from "@/src/lib/claims/submission-authorization";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawPayload = formData.get("payload");
    const receipt = formData.get("receipt");
    if (typeof rawPayload !== "string") {
      throw new Error("Claim details are missing.");
    }
    if (!(receipt instanceof File)) {
      throw new Error("A receipt image is required.");
    }
    const submission = persistedClaimSubmissionSchema.parse(
      JSON.parse(rawPayload),
    );
    if (publicConfig.claimDataMode === "live") {
      await requireMemberClaimSubmission(submission.workspace.treasuryId);
    }
    const result = await submitClaimWorkflow({
      repository: await getClaimRepository(),
      aiService: getClaimAIService(),
      submission,
      receipt,
    });
    return NextResponse.json(result, {
      status: result.idempotentReplay ? 200 : 201,
    });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? (error.issues[0]?.message ?? "Claim details are invalid.")
        : error instanceof Error
          ? error.message
          : "The claim could not be submitted.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
