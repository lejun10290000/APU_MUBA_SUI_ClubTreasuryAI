import { randomUUID } from "node:crypto";
import { normalizeSuiAddress, isValidSuiAddress } from "@mysten/sui/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { serverConfig } from "@/src/config/env";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";

export const runtime = "nodejs";

const inputSchema = z.object({
  walletAddress: z.string().trim().refine(isValidSuiAddress),
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const walletAddress = normalizeSuiAddress(input.walletAddress);
    const userClient = await createServerSupabaseClient();
    const userId = await requireSupabaseUserId(userClient);
    const admin = createAdminSupabaseClient();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 5 * 60 * 1000);
    const nonce = randomUUID();
    const host = new URL(serverConfig.NEXT_PUBLIC_APP_URL).host;
    const message = [
      "ClubTreasury AI wallet verification",
      `Domain: ${host}`,
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      `Issued: ${issuedAt.toISOString()}`,
      `Expires: ${expiresAt.toISOString()}`,
      "Purpose: bind this Supabase session to your Sui wallet. This does not authorize a payment.",
    ].join("\n");

    const { data, error } = await admin
      .from("wallet_nonces")
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        message,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();
    if (error) {
      throw error;
    }

    return NextResponse.json({
      challengeId: data.id,
      message,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wallet challenge could not be created.",
      },
      { status: 400 },
    );
  }
}
