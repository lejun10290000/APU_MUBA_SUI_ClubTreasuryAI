import { describe, expect, it } from "vitest";

import { mapLiveClaimWorkspace } from "@/src/lib/claims/live-workspace";

describe("A1 persisted workspace continuity", () => {
  it("maps an unlinked persisted treasury without inventing a Sui object", () => {
    expect(
      mapLiveClaimWorkspace(
        {
          id: "11111111-1111-4111-8111-111111111111",
          external_reference: "orientation-2026",
          name: "Orientation Night 2026",
          total_budget_minor: 150_000,
          sui_treasury_object_id: null,
        },
        [
          {
            external_reference: "food",
            name: "Food",
            allocated_minor: 50_000,
            spent_minor: 0,
          },
        ],
      ),
    ).toMatchObject({
      treasuryId: "11111111-1111-4111-8111-111111111111",
      treasuryObjectId: null,
      name: "Orientation Night 2026",
    });
  });
});
