import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidWalletPersonalMessageSignature } from "@/src/lib/sui/wallet-signature-verification";
import { createAdminSupabaseClient } from "@/src/lib/supabase/admin";
import {
  createServerSupabaseClient,
  requireSupabaseUserId,
} from "@/src/lib/supabase/server";

export const runtime = "nodejs";

const inputSchema = z.object({
  challengeId: z.string().uuid(),
  walletAddress: z.string().trim().refine(isValidSuiAddress),
  displayName: z.string().trim().min(1).max(80),
  signature: z.string().trim().min(1).max(2_000),
});

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const walletAddress = normalizeSuiAddress(input.walletAddress);
    const userClient = await createServerSupabaseClient();
    const userId = await requireSupabaseUserId(userClient);
    const admin = createAdminSupabaseClient();
    const { data: nonce, error: nonceError } = await admin
      .from("wallet_nonces")
      .select("id,user_id,wallet_address,message,expires_at,consumed_at")
      .eq("id", input.challengeId)
      .eq("user_id", userId)
      .single();
    if (nonceError || !nonce) {
      throw new Error("Wallet challenge was not found.");
    }
    if (nonce.consumed_at || new Date(nonce.expires_at) <= new Date()) {
      throw new Error("Wallet challenge has expired or was already used.");
    }
    if (nonce.wallet_address !== walletAddress) {
      throw new Error("The connected wallet does not match this challenge.");
    }

    const isValid = await isValidWalletPersonalMessageSignature({
      message: new TextEncoder().encode(nonce.message),
      signature: input.signature,
      walletAddress,
    });
    if (!isValid) {
      throw new Error("The wallet signature is invalid.");
    }

    const consumedAt = new Date().toISOString();
    const { data: consumed, error: consumeError } = await admin
      .from("wallet_nonces")
      .update({ consumed_at: consumedAt })
      .eq("id", nonce.id)
      .is("consumed_at", null)
      .gt("expires_at", consumedAt)
      .select("id")
      .maybeSingle();
    if (consumeError || !consumed) {
      throw new Error("Wallet challenge could not be consumed safely.");
    }

    const { data: existingProfile, error: existingProfileError } = await admin
      .from("wallet_profiles")
      .select("user_id")
      .eq("wallet_address", walletAddress)
      .maybeSingle();
    if (existingProfileError) {
      throw existingProfileError;
    }

    if (existingProfile) {
      const { error: profileError } = await admin
        .from("wallet_profiles")
        .update({
          display_name: input.displayName,
          verified_at: consumedAt,
        })
        .eq("user_id", existingProfile.user_id);
      if (profileError) {
        throw profileError;
      }
    } else {
      const { error: profileError } = await admin.from("wallet_profiles").upsert(
        {
          user_id: userId,
          wallet_address: walletAddress,
          display_name: input.displayName,
          verified_at: consumedAt,
        },
        { onConflict: "user_id" },
      );
      if (profileError) {
        throw profileError;
      }
    }

    return NextResponse.json({ verified: true, walletAddress });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Wallet signature could not be verified.",
      },
      { status: 400 },
    );
  }
}
