import { describe, expect, it, vi } from "vitest";
import { resolveVerifiedWalletIdentity } from "@/src/lib/supabase/wallet-principal";

function queryResult<T>(data: T, error: unknown = null) {
  return { data, error };
}

function makeAdminClient({
  nonce,
  profile,
}: {
  nonce: { wallet_address: string } | null;
  profile: { user_id: string; wallet_address: string } | null;
}) {
  const nonceSingle = vi.fn().mockResolvedValue(queryResult(nonce));
  const profileSingle = vi.fn().mockResolvedValue(queryResult(profile));

  const nonceChain: Record<string, unknown> = {};
  nonceChain.select = vi.fn(() => nonceChain);
  nonceChain.eq = vi.fn(() => nonceChain);
  nonceChain.not = vi.fn(() => nonceChain);
  nonceChain.order = vi.fn(() => nonceChain);
  nonceChain.limit = vi.fn(() => nonceChain);
  nonceChain.maybeSingle = nonceSingle;

  const profileChain: Record<string, unknown> = {};
  profileChain.select = vi.fn(() => profileChain);
  profileChain.eq = vi.fn(() => profileChain);
  profileChain.maybeSingle = profileSingle;

  return {
    from: vi.fn((table: string) => {
      if (table === "wallet_nonces") return nonceChain;
      if (table === "wallet_profiles") return profileChain;
      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe("Stage 7C canonical wallet principal", () => {
  it("maps a fresh anonymous session to the existing canonical wallet profile after a consumed challenge", async () => {
    const admin = makeAdminClient({
      nonce: {
        wallet_address:
          "0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea",
      },
      profile: {
        user_id: "de029617-d36c-452a-b0a6-17a89b0fa220",
        wallet_address:
          "0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea",
      },
    });

    await expect(
      resolveVerifiedWalletIdentity({
        sessionUserId: "e6c53a4d-c941-421b-b69f-a49c3e8b8b2d",
        adminClient: admin as never,
      }),
    ).resolves.toEqual({
      userId: "de029617-d36c-452a-b0a6-17a89b0fa220",
      walletAddress:
        "0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea",
    });
  });

  it("rejects a session that has not completed a wallet challenge", async () => {
    const admin = makeAdminClient({ nonce: null, profile: null });

    await expect(
      resolveVerifiedWalletIdentity({
        sessionUserId: "e6c53a4d-c941-421b-b69f-a49c3e8b8b2d",
        adminClient: admin as never,
      }),
    ).rejects.toThrow("Verify the connected Sui wallet before continuing.");
  });
});
