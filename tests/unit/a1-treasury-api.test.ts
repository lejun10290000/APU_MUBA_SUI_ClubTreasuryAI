import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  requireUserId: vi.fn(),
  createAdminClient: vi.fn(() => ({ kind: "admin" })),
  resolveIdentity: vi.fn(),
  generateJoinCode: vi.fn(),
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
vi.mock("@/src/lib/treasuries/join-code", () => ({
  generateJoinCode: mocks.generateJoinCode,
}));

type QueryResult = { data: unknown; error: unknown };

function query(result: QueryResult) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
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

const treasuryRow = {
  id: "11111111-1111-4111-8111-111111111111",
  owner_user_id: "22222222-2222-4222-8222-222222222222",
  external_reference: "33333333-3333-4333-8333-333333333333",
  name: "Orientation Night 2026",
  currency: "USDC",
  total_budget_minor: 150_000,
  sui_treasury_object_id: null,
  sui_treasurer_cap_object_id: null,
  sui_activation_status: "not_started",
  budget_locked_at: null,
  activated_at: null,
  join_code: "ORI1-AB12CD",
  status: "active",
  created_at: "2026-09-04T00:00:00.000Z",
  updated_at: "2026-09-04T00:00:00.000Z",
};

describe("A1 treasury API", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createServerClient.mockReset();
    mocks.requireUserId.mockReset();
    mocks.createAdminClient.mockClear();
    mocks.resolveIdentity.mockReset();
    mocks.generateJoinCode.mockReset();
    mocks.requireUserId.mockResolvedValue("session-user");
    mocks.resolveIdentity.mockResolvedValue({
      userId: treasuryRow.owner_user_id,
      walletAddress:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
    });
    mocks.generateJoinCode.mockReturnValue("ORI1-AB12CD");
  });

  it("rejects treasury creation before wallet authentication", async () => {
    mocks.createServerClient.mockResolvedValue({});
    mocks.requireUserId.mockRejectedValue(
      new Error("Authenticate the connected wallet before continuing."),
    );
    const { POST } = await import("@/app/api/treasuries/route");

    const response = await POST(
      new Request("https://example.test/api/treasuries", {
        method: "POST",
        body: JSON.stringify({
          name: "Orientation Night 2026",
          totalBudgetMinor: 150_000,
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("creates an unlinked treasury and makes the verified wallet its owner", async () => {
    const treasuryInsert = vi.fn(async (value: unknown) => {
      expect(value).toMatchObject({
        owner_user_id: treasuryRow.owner_user_id,
        name: "Orientation Night 2026",
        total_budget_minor: 150_000,
        sui_treasury_object_id: null,
        join_code: "ORI1-AB12CD",
      });
      return { data: null, error: null };
    });
    const membershipInsert = vi.fn(async (value: unknown) => {
      expect(value).toEqual({
        treasury_id: treasuryRow.id,
        user_id: treasuryRow.owner_user_id,
        role: "owner",
      });
      return { data: null, error: null };
    });
    let treasuryCalls = 0;
    const client = {
      from: vi.fn((table: string) => {
        if (table === "treasuries") {
          treasuryCalls += 1;
          return treasuryCalls === 1
            ? { insert: treasuryInsert }
            : query({ data: treasuryRow, error: null });
        }
        if (table === "treasury_members") {
          return { insert: membershipInsert };
        }
        throw new Error(`Unexpected table ${table}`);
      }),
    };
    mocks.createServerClient.mockResolvedValue(client);
    const { POST } = await import("@/app/api/treasuries/route");

    const response = await POST(
      new Request("https://example.test/api/treasuries", {
        method: "POST",
        body: JSON.stringify({
          name: "Orientation Night 2026",
          totalBudgetMinor: 150_000,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      treasury: {
        id: treasuryRow.id,
        linkedToSui: false,
        role: "owner",
        categories: [],
      },
    });
    expect(treasuryInsert).toHaveBeenCalledOnce();
    expect(membershipInsert).toHaveBeenCalledOnce();
  });

  it("retries a join-code collision without reusing a Sui treasury", async () => {
    mocks.generateJoinCode
      .mockReturnValueOnce("AAAA-AAAAAA")
      .mockReturnValueOnce("BBBB-BBBBBB");
    const insert = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { code: "23505" } })
      .mockResolvedValueOnce({ data: null, error: null });
    let treasuryCalls = 0;
    const client = {
      from: vi.fn((table: string) => {
        if (table === "treasuries") {
          treasuryCalls += 1;
          return treasuryCalls <= 2
            ? { insert }
            : query({
                data: { ...treasuryRow, join_code: "BBBB-BBBBBB" },
                error: null,
              });
        }
        return { insert: vi.fn(async () => ({ data: null, error: null })) };
      }),
    };
    mocks.createServerClient.mockResolvedValue(client);
    const { POST } = await import("@/app/api/treasuries/route");

    const response = await POST(
      new Request("https://example.test/api/treasuries", {
        method: "POST",
        body: JSON.stringify({ name: treasuryRow.name, totalBudgetMinor: 150_000 }),
      }),
    );

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[0]?.[0]).toMatchObject({
      sui_treasury_object_id: null,
      join_code: "AAAA-AAAAAA",
    });
    expect(insert.mock.calls[1]?.[0]).toMatchObject({
      sui_treasury_object_id: null,
      join_code: "BBBB-BBBBBB",
    });
  });

  it("lists only RLS-visible treasuries and hides join codes from members", async () => {
    const ownerTreasury = {
      ...treasuryRow,
      sui_treasury_object_id: `0x${"7".repeat(64)}`,
      sui_treasurer_cap_object_id: `0x${"8".repeat(64)}`,
      sui_activation_status: "active",
      budget_locked_at: "2026-09-05T00:00:00.000Z",
      activated_at: "2026-09-05T00:02:00.000Z",
    };
    const memberTreasury = {
      ...treasuryRow,
      id: "44444444-4444-4444-8444-444444444444",
      owner_user_id: "55555555-5555-4555-8555-555555555555",
      join_code: "MEM1-ABCDEF",
    };
    const results: Record<string, QueryResult> = {
      treasuries: { data: [ownerTreasury, memberTreasury], error: null },
      treasury_members: {
        data: [{ treasury_id: memberTreasury.id, role: "member" }],
        error: null,
      },
      budget_categories: {
        data: [
          {
            id: "66666666-6666-4666-8666-666666666666",
            treasury_id: treasuryRow.id,
            external_reference: "food",
            name: "Food",
            allocated_minor: 150_000,
            spent_minor: 0,
            created_at: "2026-09-04T00:00:00.000Z",
            updated_at: "2026-09-04T00:00:00.000Z",
          },
        ],
        error: null,
      },
      treasury_sui_activations: { data: [], error: null },
    };
    const client = {
      from: vi.fn((table: string) => query(results[table]!)),
    };
    mocks.createServerClient.mockResolvedValue(client);
    const { GET } = await import("@/app/api/treasuries/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.treasuries).toHaveLength(2);
    expect(body.treasuries[0]).toMatchObject({
      id: ownerTreasury.id,
      role: "owner",
      joinCode: "ORI1-AB12CD",
    });
    expect(body.treasuries[1]).toMatchObject({
      id: memberTreasury.id,
      role: "member",
    });
    expect(body.treasuries[1]).not.toHaveProperty("joinCode");
  });
});
