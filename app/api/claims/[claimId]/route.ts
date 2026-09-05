import { NextResponse } from "next/server";
import { z } from "zod";
import { serverConfig } from "@/src/config/env";
import { receiptAnalysisSchema } from "@/src/lib/ai/types";
import { getClaimRepository } from "@/src/lib/claims";
import { createAuthorizedReceiptUrl } from "@/src/lib/claims/receipt-url";

const paramsSchema = z.object({ claimId: z.string().uuid() });

export async function GET(
  _request: Request,
  context: { params: Promise<{ claimId: string }> },
) {
  try {
    const { claimId } = paramsSchema.parse(await context.params);
    const repository = await getClaimRepository();
    const claim = await repository.getClaim(claimId);
    if (!claim) {
      return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    }
    const treasuryLink = await repository.getTreasuryLinkState(
      claim.treasuryId,
    );
    const parsedAnalysis = receiptAnalysisSchema.safeParse(claim.receiptAnalysis);
    const aiProvenance =
      serverConfig.AI_MODE === "live" && parsedAnalysis.success
        ? {
            provider: "Google Gemini" as const,
            model: serverConfig.GEMINI_MODEL,
            mode: "live" as const,
            task: "receipt_analysis" as const,
            generatedAt: claim.createdAt,
            humanConfirmationRequired: true as const,
          }
        : null;
    try {
      const receiptPreviewUrl = await createAuthorizedReceiptUrl(claimId);
      return NextResponse.json({
        claim,
        treasuryLink,
        aiProvenance,
        receiptPreviewUrl,
      });
    } catch {
      return NextResponse.json({
        claim,
        treasuryLink,
        aiProvenance,
        receiptPreviewUrl: null,
        receiptPreviewError:
          "Private receipt preview is temporarily unavailable. The persisted claim can still be reviewed.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The claim could not be loaded.",
      },
      { status: 400 },
    );
  }
}
