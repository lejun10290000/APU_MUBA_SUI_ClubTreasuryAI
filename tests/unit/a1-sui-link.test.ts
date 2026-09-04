import { beforeEach, describe, expect, it, vi } from "vitest";

const packageId = `0x${"1".repeat(64)}`;
const coinType = `0x${"2".repeat(64)}::usdc::USDC`;
const treasuryObjectId = `0x${"3".repeat(64)}`;
const otherObjectId = `0x${"4".repeat(64)}`;
const capObjectId = `0x${"5".repeat(64)}`;
const walletAddress = `0x${"6".repeat(64)}`;
const appTreasuryId = "11111111-1111-4111-8111-111111111111";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  requireUserId: vi.fn(),
  createAdminClient: vi.fn(),
  resolveIdentity: vi.fn(),
  getObject: vi.fn(),
  verifyCap: vi.fn(),
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
vi.mock("@/src/lib/sui/treasurer-cap-verification", () => ({
  verifyTreasurerCap: mocks.verifyCap,
}));
vi.mock("@mysten/sui/grpc", () => ({
  SuiGrpcClient: class {
    getObject = mocks.getObject;
  },
}));
vi.mock("@/src/config/public-env", () => ({
  publicConfig: {
    suiNetwork: "testnet",
    suiRpcUrl: "https://rpc.test",
    suiPackageId: packageId,
    suiUsdcCoinType: coinType,
    demoTreasuryObjectId: otherObjectId,
  },
}));

const treasuryRow = {
  id: appTreasuryId,
  owner_user_id: "owner-user",
  external_reference: "orientation-2026",
  name: "Orientation Night 2026",
  currency: "USDC" as const,
  total_budget_minor: 150_000,
  sui_treasury_object_id: null as string | null,
  join_code: "ORI1-AB12CD",
  status: "active" as const,
  created_at: "2026-09-04T00:00:00.000Z",
  updated_at: "2026-09-04T00:00:00.000Z",
};

function query(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    update: vi.fn((_value?: unknown) => {
      void _value;
      return chain;
    }),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
  };
  return chain;
}

describe("A1 verified Sui treasury link", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.requireUserId.mockResolvedValue("session-user");
    mocks.resolveIdentity.mockResolvedValue({
      userId: "owner-user",
      walletAddress,
    });
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => query({ data: null, error: null })),
    });
    mocks.verifyCap.mockResolvedValue({
      capObjectId,
      treasuryObjectId,
      ownerAddress: walletAddress,
      type: `${packageId}::treasury::TreasurerCap<${coinType}>`,
    });
    mocks.getObject.mockResolvedValue({
      object: {
        objectId: treasuryObjectId,
        type: `${packageId}::treasury::Treasury<${coinType}>`,
        owner: { $kind: "Shared", Shared: { initialSharedVersion: "1" } },
      },
    });
  });

  it("blocks a member from linking an app treasury", async () => {
    mocks.resolveIdentity.mockResolvedValue({
      userId: "member-user",
      walletAddress,
    });
    mocks.createServerClient.mockResolvedValue(clientFor(treasuryRow));
    const { POST } = await import(
      "@/app/api/treasuries/[treasuryId]/link-sui/route"
    );

    const response = await POST(request(treasuryObjectId), {
      params: Promise.resolve({ treasuryId: appTreasuryId }),
    });

    expect(response.status).toBe(403);
    expect(mocks.verifyCap).not.toHaveBeenCalled();
  });

  it("links only after the connected owner wallet and exact Cap relation verify", async () => {
    const update = vi.fn();
    mocks.createServerClient.mockResolvedValue(clientFor(treasuryRow, update));
    const { POST } = await import(
      "@/app/api/treasuries/[treasuryId]/link-sui/route"
    );

    const response = await POST(request(treasuryObjectId), {
      params: Promise.resolve({ treasuryId: appTreasuryId }),
    });

    expect(response.status).toBe(200);
    expect(mocks.verifyCap).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        capObjectId,
        connectedWalletAddress: walletAddress,
        approvedTreasuryObjectId: treasuryObjectId,
        packageId,
        coinType,
      }),
    );
    expect(update).toHaveBeenCalledWith({
      sui_treasury_object_id: treasuryObjectId,
    });
  });

  it("rejects a Treasury with the wrong Move type or ownership", async () => {
    mocks.createServerClient.mockResolvedValue(clientFor(treasuryRow));
    mocks.getObject.mockResolvedValueOnce({
      object: {
        objectId: treasuryObjectId,
        type: `${packageId}::treasury::Treasury<0x2::sui::SUI>`,
        owner: { $kind: "Shared", Shared: {} },
      },
    });
    const { POST } = await import(
      "@/app/api/treasuries/[treasuryId]/link-sui/route"
    );

    const wrongType = await POST(request(treasuryObjectId), {
      params: Promise.resolve({ treasuryId: appTreasuryId }),
    });
    expect(wrongType.status).toBe(400);

    mocks.getObject.mockResolvedValueOnce({
      object: {
        objectId: treasuryObjectId,
        type: `${packageId}::treasury::Treasury<${coinType}>`,
        owner: { $kind: "AddressOwner", AddressOwner: walletAddress },
      },
    });
    mocks.createServerClient.mockResolvedValue(clientFor(treasuryRow));
    const wrongOwner = await POST(request(treasuryObjectId), {
      params: Promise.resolve({ treasuryId: appTreasuryId }),
    });
    expect(wrongOwner.status).toBe(400);
  });

  it("does not silently overwrite a different existing link", async () => {
    mocks.createServerClient.mockResolvedValue(
      clientFor({ ...treasuryRow, sui_treasury_object_id: otherObjectId }),
    );
    const { POST } = await import(
      "@/app/api/treasuries/[treasuryId]/link-sui/route"
    );

    const response = await POST(request(treasuryObjectId), {
      params: Promise.resolve({ treasuryId: appTreasuryId }),
    });

    expect(response.status).toBe(409);
    expect(mocks.getObject).not.toHaveBeenCalled();
  });

  it("returns success without another write for an idempotent same-id relink", async () => {
    const update = vi.fn();
    mocks.createServerClient.mockResolvedValue(
      clientFor(
        { ...treasuryRow, sui_treasury_object_id: treasuryObjectId },
        update,
      ),
    );
    const { POST } = await import(
      "@/app/api/treasuries/[treasuryId]/link-sui/route"
    );

    const response = await POST(request(treasuryObjectId), {
      params: Promise.resolve({ treasuryId: appTreasuryId }),
    });

    expect(response.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });
});

function clientFor(row: typeof treasuryRow, updateSpy = vi.fn()) {
  const initial = query({ data: row, error: null });
  const updated = query({
    data: { ...row, sui_treasury_object_id: treasuryObjectId },
    error: null,
  });
  updated.update.mockImplementation((value?: unknown) => {
    updateSpy(value);
    return updated;
  });
  let treasuryCalls = 0;
  return {
    from: vi.fn((table: string) => {
      if (table !== "treasuries") throw new Error(`Unexpected table ${table}`);
      treasuryCalls += 1;
      return treasuryCalls === 1 ? initial : updated;
    }),
  };
}

function request(treasuryId: string) {
  return new Request("https://example.test/api/treasuries/link-sui", {
    method: "POST",
    body: JSON.stringify({
      treasuryObjectId: treasuryId,
      treasurerCapObjectId: capObjectId,
    }),
  });
}
