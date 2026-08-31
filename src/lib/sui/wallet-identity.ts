"use client";

import { normalizeSuiAddress } from "@mysten/sui/utils";
import { getBrowserSupabaseClient } from "@/src/lib/supabase/browser";

interface PersonalMessageSigner {
  signPersonalMessage(input: {
    message: Uint8Array;
  }): Promise<{ signature: string }>;
}

export async function ensureWalletIdentity({
  signer,
  walletAddress,
  displayName,
}: {
  signer: PersonalMessageSigner;
  walletAddress: string;
  displayName: string;
}): Promise<void> {
  const supabase = getBrowserSupabaseClient();
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }
  if (!sessionData.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw error;
    }
  }

  const normalizedAddress = normalizeSuiAddress(walletAddress);
  const { data: verifiedProfile, error: profileError } = await supabase
    .from("wallet_profiles")
    .select("wallet_address")
    .maybeSingle();
  if (profileError) {
    throw profileError;
  }
  if (verifiedProfile?.wallet_address === normalizedAddress) {
    return;
  }

  const challengeResponse = await fetch("/api/auth/wallet/challenge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ walletAddress: normalizedAddress }),
  });
  const challenge = (await challengeResponse.json()) as {
    challengeId?: string;
    message?: string;
    error?: string;
  };
  if (!challengeResponse.ok || !challenge.challengeId || !challenge.message) {
    throw new Error(
      challenge.error ?? "Wallet challenge could not be created.",
    );
  }

  const signed = await signer.signPersonalMessage({
    message: new TextEncoder().encode(challenge.message),
  });
  const verifyResponse = await fetch("/api/auth/wallet/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      challengeId: challenge.challengeId,
      walletAddress: normalizedAddress,
      displayName,
      signature: signed.signature,
    }),
  });
  const verified = (await verifyResponse.json()) as {
    verified?: boolean;
    error?: string;
  };
  if (!verifyResponse.ok || !verified.verified) {
    throw new Error(
      verified.error ?? "Wallet signature could not be verified.",
    );
  }
}
