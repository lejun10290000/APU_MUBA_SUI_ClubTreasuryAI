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
const treasury = {
  id: treasuryId,
  total_budget_minor: 150_000,
  status: "active",
};

function treasuryQuery() {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data: treasury, error: null })),
  };
  return chain;
}

function request(categories: Array<{ name: string; allocationMinor: number }>) {
  return new Request(`https://example.test/api/treasuries/${treasuryId}/budget`, {
    method: "PUT",
    body: JSON.stringify({ categories }),
  });
}

const context = { params: Promise.resolve({ treasuryId }) };

describe("A1 live budget API", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createServerClient.mockReset();
    mocks.requireUserId.mockReset().mockResolvedValue("session-user");
    mocks.resolveIdentity.mockReset().mockResolvedValue({
      userId: "22222222-2222-4222-8222-222222222222",
      walletAddress:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
    });
  });

  it("rejects an unbalanced live budget before calling the RPC", async () => {
    const rpc = vi.fn();
    mocks.createServerClient.mockResolvedValue({
      from: vi.fn(() => treasuryQuery()),
      rpc,
    });
    const { PUT } = await import(
      "@/app/api/treasuries/[treasuryId]/budget/route"
    );

    const response = await PUT(
      request([
        { name: "Food", allocationMinor: 50_000 },
        { name: "Venue", allocationMinor: 90_000 },
      ]),
      context,
    );

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a member before replacing categories", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "can_manage_treasury") {
        return { data: false, error: null };
      }
      throw new Error(`Unexpected RPC ${name}`);
    });
    mocks.createServerClient.mockResolvedValue({
      from: vi.fn(() => treasuryQuery()),
      rpc,
    });
    const { PUT } = await import(
      "@/app/api/treasuries/[treasuryId]/budget/route"
    );

    const response = await PUT(
      request([{ name: "Food", allocationMinor: 150_000 }]),
      context,
    );

    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalledWith(
      "replace_treasury_budget",
      expect.anything(),
    );
  });

  it("persists a balanced owner budget through the atomic RPC", async () => {
    const persisted = [
      {
        id: "33333333-3333-4333-8333-333333333333",
        treasury_id: treasuryId,
        external_reference: "food-01",
        name: "Food",
        allocated_minor: 60_000,
        spent_minor: 0,
        created_at: "2026-09-04T00:00:00.000Z",
        updated_at: "2026-09-04T00:00:00.000Z",
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        treasury_id: treasuryId,
        external_reference: "venue-02",
        name: "Venue",
        allocated_minor: 90_000,
        spent_minor: 0,
        created_at: "2026-09-04T00:00:00.000Z",
        updated_at: "2026-09-04T00:00:00.000Z",
      },
    ];
    const rpc = vi.fn(async (name: string) => {
      if (name === "can_manage_treasury") return { data: true, error: null };
      if (name === "replace_treasury_budget") {
        return { data: persisted, error: null };
      }
      throw new Error(`Unexpected RPC ${name}`);
    });
    mocks.createServerClient.mockResolvedValue({
      from: vi.fn(() => treasuryQuery()),
      rpc,
    });
    const { PUT } = await import(
      "@/app/api/treasuries/[treasuryId]/budget/route"
    );

    const response = await PUT(
      request([
        { name: " Food ", allocationMinor: 60_000 },
        { name: "Venue", allocationMinor: 90_000 },
      ]),
      context,
    );

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("replace_treasury_budget", {
      p_treasury_id: treasuryId,
      p_categories: [
        { name: "Food", allocated_minor: 60_000 },
        { name: "Venue", allocated_minor: 90_000 },
      ],
    });
    await expect(response.json()).resolves.toEqual({
      categories: [
        {
          id: persisted[0]!.id,
          externalReference: "food-01",
          name: "Food",
          allocatedMinor: 60_000,
          spentMinor: 0,
        },
        {
          id: persisted[1]!.id,
          externalReference: "venue-02",
          name: "Venue",
          allocatedMinor: 90_000,
          spentMinor: 0,
        },
      ],
    });
  });
});
