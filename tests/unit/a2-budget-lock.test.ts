import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  requireUserId: vi.fn(),
  createAdminClient: vi.fn(() => ({ kind: "admin" })),
  resolveIdentity: vi.fn(),
}));

vi.mock("@/src/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerClient,
  requireSupabaseUserId: mocks.requireUserId,
}));
vi.mock("@/src/lib/supabase/admin", () => ({
  createAdminSupabaseClient: mocks.createAdminClient,
}));
vi.mock("@/src/lib/supabase/wallet-principal", () => ({
  resolveVerifiedWalletIdentity: mocks.resolveIdentity,
}));

const treasuryId = "11111111-1111-4111-8111-111111111111";

describe("A2 budget lock", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.requireUserId.mockResolvedValue("session-user");
    mocks.resolveIdentity.mockResolvedValue({
      userId: "22222222-2222-4222-8222-222222222222",
      walletAddress:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
    });
  });

  it("rejects mutation after activation starts", async () => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(async () => ({
        data: {
          id: treasuryId,
          total_budget_minor: 100_000,
          status: "active",
          budget_locked_at: "2026-09-05T00:00:00Z",
          sui_activation_status: "in_progress",
        },
        error: null,
      })),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    const rpc = vi.fn();
    mocks.createServerClient.mockResolvedValue({
      from: vi.fn(() => chain),
      rpc,
    });

    const { PUT } = await import(
      "@/app/api/treasuries/[treasuryId]/budget/route"
    );
    const response = await PUT(
      new Request(`https://example.test/api/treasuries/${treasuryId}/budget`, {
        method: "PUT",
        body: JSON.stringify({
          categories: [{ name: "Food", allocationMinor: 100_000 }],
        }),
      }),
      { params: Promise.resolve({ treasuryId }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Budget is locked because Sui activation has started.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
