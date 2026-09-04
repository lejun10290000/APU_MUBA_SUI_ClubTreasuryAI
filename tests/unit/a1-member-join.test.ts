import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  requireUserId: vi.fn(),
  createAdminClient: vi.fn(),
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

type QueryResult = { data: unknown; error: unknown };

function query(result: QueryResult) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

const userId = "22222222-2222-4222-8222-222222222222";
const treasury = {
  id: "11111111-1111-4111-8111-111111111111",
  owner_user_id: "33333333-3333-4333-8333-333333333333",
  external_reference: "orientation-2026",
  name: "Orientation Night 2026",
  currency: "USDC" as const,
  total_budget_minor: 150_000,
  sui_treasury_object_id: null,
  join_code: "ORI1-AB12CD",
  status: "active" as const,
  created_at: "2026-09-04T00:00:00.000Z",
  updated_at: "2026-09-04T00:00:00.000Z",
};
const category = {
  id: "44444444-4444-4444-8444-444444444444",
  treasury_id: treasury.id,
  external_reference: "food",
  name: "Food",
  allocated_minor: 150_000,
  spent_minor: 0,
  created_at: "2026-09-04T00:00:00.000Z",
  updated_at: "2026-09-04T00:00:00.000Z",
};

describe("A1 member join API", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createServerClient.mockReset();
    mocks.requireUserId.mockReset();
    mocks.createAdminClient.mockReset();
    mocks.resolveIdentity.mockReset();
    mocks.requireUserId.mockResolvedValue("session-user");
    mocks.resolveIdentity.mockResolvedValue({
      userId,
      walletAddress:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
    });
  });

  it("rejects joining before a verified wallet principal exists", async () => {
    mocks.createServerClient.mockResolvedValue({});
    mocks.createAdminClient.mockReturnValue({});
    mocks.resolveIdentity.mockRejectedValue(
      new Error("Verify the connected Sui wallet before continuing."),
    );
    const { POST } = await import("@/app/api/treasuries/join/route");

    const response = await POST(joinRequest("ORI1-AB12CD"));

    expect(response.status).toBe(401);
  });

  it("rejects an unknown or closed join code", async () => {
    const adminClient = {
      from: vi.fn(() => query({ data: null, error: null })),
    };
    mocks.createAdminClient.mockReturnValue(adminClient);
    mocks.createServerClient.mockResolvedValue({});
    const { POST } = await import("@/app/api/treasuries/join/route");

    const response = await POST(joinRequest("closed-code"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/not found|active/i),
    });
  });

  it("creates only a missing member row and returns it through the user client", async () => {
    const insert = vi.fn(async () => ({ data: null, error: null }));
    let membershipCalls = 0;
    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "treasuries")
          return query({ data: treasury, error: null });
        if (table === "treasury_members") {
          membershipCalls += 1;
          return membershipCalls === 1
            ? query({ data: null, error: null })
            : { insert };
        }
        throw new Error(`Unexpected admin table ${table}`);
      }),
    };
    const userClient = {
      from: vi.fn((table: string) => {
        if (table === "treasuries")
          return query({ data: treasury, error: null });
        if (table === "budget_categories") {
          return query({ data: [category], error: null });
        }
        throw new Error(`Unexpected user table ${table}`);
      }),
    };
    mocks.createAdminClient.mockReturnValue(adminClient);
    mocks.createServerClient.mockResolvedValue(userClient);
    const { POST } = await import("@/app/api/treasuries/join/route");

    const response = await POST(joinRequest(" ori1-ab12cd "));

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith({
      treasury_id: treasury.id,
      user_id: userId,
      role: "member",
    });
    await expect(response.json()).resolves.toMatchObject({
      treasury: {
        id: treasury.id,
        role: "member",
        categories: [{ name: "Food" }],
      },
    });
  });

  it.each(["owner", "treasurer"] as const)(
    "preserves an existing %s role without inserting or downgrading it",
    async (role) => {
      const insert = vi.fn();
      const adminClient = {
        from: vi.fn((table: string) => {
          if (table === "treasuries")
            return query({ data: treasury, error: null });
          if (table === "treasury_members") {
            return Object.assign(
              query({
                data: { treasury_id: treasury.id, user_id: userId, role },
                error: null,
              }),
              { insert },
            );
          }
          throw new Error(`Unexpected admin table ${table}`);
        }),
      };
      const userClient = {
        from: vi.fn((table: string) =>
          table === "treasuries"
            ? query({ data: treasury, error: null })
            : query({ data: [category], error: null }),
        ),
      };
      mocks.createAdminClient.mockReturnValue(adminClient);
      mocks.createServerClient.mockResolvedValue(userClient);
      const { POST } = await import("@/app/api/treasuries/join/route");

      const response = await POST(joinRequest("ORI1-AB12CD"));

      expect(response.status).toBe(200);
      expect(insert).not.toHaveBeenCalled();
      await expect(response.json()).resolves.toMatchObject({
        treasury: { role },
      });
    },
  );
});

function joinRequest(joinCode: string) {
  return new Request("https://example.test/api/treasuries/join", {
    method: "POST",
    body: JSON.stringify({ joinCode }),
  });
}
