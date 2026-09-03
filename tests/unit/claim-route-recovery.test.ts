import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  getClaim: vi.fn(),
  createAuthorizedReceiptUrl: vi.fn(),
}));

vi.mock("@/src/lib/claims", () => ({
  getClaimRepository: async () => ({ getClaim: state.getClaim }),
}));

vi.mock("@/src/lib/claims/receipt-url", () => ({
  createAuthorizedReceiptUrl: state.createAuthorizedReceiptUrl,
}));

describe("claim review route recovery", () => {
  beforeEach(() => {
    state.getClaim.mockReset();
    state.createAuthorizedReceiptUrl.mockReset();
  });

  it("keeps an authorized claim reviewable when private preview generation is temporarily unavailable", async () => {
    const claim = { id: "69a20a42-ae58-4547-b2f5-28bb2de52262" };
    state.getClaim.mockResolvedValue(claim);
    state.createAuthorizedReceiptUrl.mockRejectedValue(
      new Error("storage provider unavailable"),
    );
    const { GET } = await import("@/app/api/claims/[claimId]/route");

    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ claimId: claim.id }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      claim,
      receiptPreviewUrl: null,
      receiptPreviewError:
        "Private receipt preview is temporarily unavailable. The persisted claim can still be reviewed.",
    });
  });
});
