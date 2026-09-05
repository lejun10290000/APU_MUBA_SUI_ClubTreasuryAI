import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  parseBudget: vi.fn(),
  requireUser: vi.fn(),
  resolveIdentity: vi.fn(),
}));

vi.mock("@/src/lib/ai", () => ({
  getAIService: () => ({ parseBudget: state.parseBudget }),
}));

vi.mock("@/src/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ kind: "session" }),
  requireSupabaseUserId: state.requireUser,
}));

vi.mock("@/src/lib/supabase/admin", () => ({
  createAdminSupabaseClient: () => ({ kind: "admin" }),
}));

vi.mock("@/src/lib/supabase/wallet-principal", () => ({
  resolveVerifiedWalletIdentity: state.resolveIdentity,
}));

vi.mock("@/src/config/env", () => ({
  serverConfig: {
    AI_MODE: "live",
    GEMINI_MODEL: "gemini-2.5-flash",
    GEMINI_LIVE_REQUESTS_ENABLED: true,
    GEMINI_API_KEY: "configured-test-key",
  },
}));

beforeEach(() => {
  vi.resetModules();
  state.parseBudget.mockReset();
  state.requireUser.mockReset();
  state.resolveIdentity.mockReset();
  state.requireUser.mockResolvedValue("user-1");
  state.resolveIdentity.mockResolvedValue({
    userId: "user-1",
    walletAddress: `0x${"1".repeat(64)}`,
  });
  state.parseBudget.mockResolvedValue({
    currency: "USDC",
    categories: [
      { name: "Food", amountMinor: 400 },
      { name: "Marketing", amountMinor: 300 },
      { name: "Transport", amountMinor: 200 },
      { name: "Miscellaneous", amountMinor: 100 },
    ],
    notes: [],
  });
});

describe("Stage 8 Gemini budget draft API", () => {
  it("returns a live Gemini draft plus safe provenance without persisting", async () => {
    const { POST } = await import("@/app/api/ai/budget-draft/route");
    const response = await POST(
      new Request("http://localhost/api/ai/budget-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instruction:
            "I have 10 USDC. Use 4 for food, 3 for marketing, 2 for transport and 1 for miscellaneous.",
        }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(state.requireUser).toHaveBeenCalledOnce();
    expect(state.resolveIdentity).toHaveBeenCalledOnce();
    expect(state.parseBudget).toHaveBeenCalledOnce();
    expect(json.draft.categories).toHaveLength(4);
    expect(json.provenance).toMatchObject({
      provider: "Google Gemini",
      model: "gemini-2.5-flash",
      mode: "live",
      task: "budget_draft",
      humanConfirmationRequired: true,
    });
    expect(json.provenance.generatedAt).toEqual(expect.any(String));
    expect(json.provenance).not.toHaveProperty("apiKey");
  });

  it("rejects empty instructions", async () => {
    const { POST } = await import("@/app/api/ai/budget-draft/route");
    const response = await POST(
      new Request("http://localhost/api/ai/budget-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    expect(state.parseBudget).not.toHaveBeenCalled();
  });
});
