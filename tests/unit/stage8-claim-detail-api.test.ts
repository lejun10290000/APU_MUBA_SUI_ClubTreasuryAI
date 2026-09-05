import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getClaim: vi.fn(),
  getTreasuryLinkState: vi.fn(),
  createAuthorizedReceiptUrl: vi.fn(),
}));

vi.mock("@/src/lib/claims", () => ({
  getClaimRepository: async () => ({
    getClaim: state.getClaim,
    getTreasuryLinkState: state.getTreasuryLinkState,
  }),
}));

vi.mock("@/src/lib/claims/receipt-url", () => ({
  createAuthorizedReceiptUrl: state.createAuthorizedReceiptUrl,
}));

vi.mock("@/src/config/env", () => ({
  serverConfig: {
    AI_MODE: "live",
    GEMINI_MODEL: "gemini-2.5-flash",
  },
}));

const claimId = "69a20a42-ae58-4547-b2f5-28bb2de52262";
const structuredAnalysis = {
  merchant: "Campus Cafe",
  amountMinor: 10,
  currency: "USDC",
  receiptDate: "2026-09-05",
  description: "Sandwich and tea",
  categorySuggestion: "Cafe",
  needsReview: false,
  missingFields: [],
  reasons: ["Receipt is legible."],
};

beforeEach(() => {
  state.getClaim.mockReset();
  state.getTreasuryLinkState.mockReset();
  state.createAuthorizedReceiptUrl.mockReset();
  state.getTreasuryLinkState.mockResolvedValue({
    linked: true,
    treasuryObjectId: `0x${"a".repeat(64)}`,
  });
  state.createAuthorizedReceiptUrl.mockResolvedValue("https://example.test/receipt");
});

describe("Stage 8 claim detail AI provenance", () => {
  it("returns safe current Gemini provenance for a stored structured receipt analysis", async () => {
    state.getClaim.mockResolvedValue({
      id: claimId,
      treasuryId: "355fbe92-9e46-41be-8b08-620d01e119ec",
      createdAt: "2026-09-05T07:00:00.000Z",
      receiptAnalysis: structuredAnalysis,
    });
    const { GET } = await import("@/app/api/claims/[claimId]/route");
    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ claimId }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.aiProvenance).toMatchObject({
      provider: "Google Gemini",
      model: "gemini-2.5-flash",
      mode: "live",
      task: "receipt_analysis",
      humanConfirmationRequired: true,
    });
    expect(json.aiProvenance.generatedAt).toBe("2026-09-05T07:00:00.000Z");
    expect(json.aiProvenance).not.toHaveProperty("apiKey");
  });

  it("returns no provenance when the stored receipt analysis is not structured", async () => {
    state.getClaim.mockResolvedValue({
      id: claimId,
      treasuryId: "355fbe92-9e46-41be-8b08-620d01e119ec",
      createdAt: "2026-09-05T07:00:00.000Z",
      receiptAnalysis: { failed: true, message: "manual review" },
    });
    const { GET } = await import("@/app/api/claims/[claimId]/route");
    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ claimId }),
    });
    const json = await response.json();

    expect(json.aiProvenance).toBeNull();
  });
});
