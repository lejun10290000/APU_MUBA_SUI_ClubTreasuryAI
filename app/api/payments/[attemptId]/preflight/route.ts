import { NextResponse } from "next/server";
import { z } from "zod";
import { serverConfig } from "@/src/config/env";
import { getClaimRepository } from "@/src/lib/claims";
import { preflightClaimPayment } from "@/src/lib/payments/contracts";
import { getPaymentPreflightTreasuryReader } from "@/src/lib/payments/server";

const paramsSchema = z.object({ attemptId: z.string().uuid() });

export async function POST(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = paramsSchema.parse(await context.params);
    const repository = await getClaimRepository();
    const result = await preflightClaimPayment(
      repository,
      await getPaymentPreflightTreasuryReader(repository, attemptId),
      {
        packageId: requirePackageId(),
        coinType: serverConfig.NEXT_PUBLIC_SUI_USDC_COIN_TYPE,
      },
      attemptId,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payout consistency check could not be completed.",
      },
      { status: 400 },
    );
  }
}

function requirePackageId() {
  const packageId = serverConfig.NEXT_PUBLIC_SUI_PACKAGE_ID;
  if (!packageId)
    throw new Error("The Sui Testnet package ID is not configured.");
  return packageId;
}
