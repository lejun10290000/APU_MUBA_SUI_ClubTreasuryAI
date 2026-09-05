import { describe, expect, it } from "vitest";

import { buildAuthorizedPaidHistory } from "@/src/lib/history/server";

describe("A2 paid History authorization", () => {
  it("keeps only managed paid claims with confirmed evidence and sorts newest first", () => {
    const result = buildAuthorizedPaidHistory({
      managedTreasuries: [
        { id: "t-owned", name: "Owned Treasury" },
        { id: "t-managed", name: "Managed Treasury" },
      ],
      categories: [
        { id: "c-owned", name: "Food" },
        { id: "c-managed", name: "Venue" },
      ],
      claims: [
        paidClaim("old", "t-owned", "c-owned", "2026-09-03T00:00:00Z"),
        paidClaim("new", "t-managed", "c-managed", "2026-09-05T00:00:00Z"),
        { ...paidClaim("other", "t-other", "c-owned", "2026-09-06T00:00:00Z") },
        { ...paidClaim("unpaid", "t-owned", "c-owned", "2026-09-07T00:00:00Z"), status: "approved_unpaid", payment_status: "unpaid" },
        { ...paidClaim("no-digest", "t-owned", "c-owned", "2026-09-08T00:00:00Z"), confirmed_transaction_digest: null },
      ],
    });

    expect(result.map((item) => item.claimId)).toEqual(["new", "old"]);
    expect(result[0]).toMatchObject({
      treasuryName: "Managed Treasury",
      categoryName: "Venue",
      digest: "digest-new-123456789012345",
      confirmedAt: "2026-09-05T00:00:00Z",
    });
  });
});

function paidClaim(id: string, treasuryId: string, categoryId: string, paidAt: string) {
  return {
    id,
    treasury_id: treasuryId,
    category_id: categoryId,
    status: "paid",
    payment_status: "paid",
    approved_amount_minor: 100,
    approved_recipient_sui_address: `0x${"4".repeat(64)}`,
    confirmed_transaction_digest: `digest-${id}-123456789012345`,
    paid_at: paidAt,
  };
}
