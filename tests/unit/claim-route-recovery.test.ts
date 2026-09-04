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

describe("claim review route recovery", () => {
  beforeEach(() => {
    state.getClaim.mockReset();
    state.getTreasuryLinkState.mockReset();
    state.createAuthorizedReceiptUrl.mockReset();
  });

  it("keeps an authorized claim reviewable when private preview generation is temporarily unavailable", async () => {
    const claim = {
      id: "69a20a42-ae58-4547-b2f5-28bb2de52262",
      treasuryId: "355fbe92-9e46-41be-8b08-620d01e119ec",
      treasuryObjectId: null,
    };
    const treasuryLink = {
      linked: true,
      treasuryObjectId:
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    };
    state.getClaim.mockResolvedValue(claim);
    state.getTreasuryLinkState.mockResolvedValue(treasuryLink);
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
      treasuryLink,
      receiptPreviewUrl: null,
      receiptPreviewError:
        "Private receipt preview is temporarily unavailable. The persisted claim can still be reviewed.",
    });
    expect(state.getTreasuryLinkState).toHaveBeenCalledWith(claim.treasuryId);
  });
});
