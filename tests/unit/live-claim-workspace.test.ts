import { describe, expect, it } from "vitest";
import { mapLiveClaimWorkspace } from "@/src/lib/claims/live-workspace";

describe("live claim workspace", () => {
  it("uses persisted treasury and category values instead of demo budget values", () => {
    expect(
      mapLiveClaimWorkspace(
        {
          id: "11111111-1111-4111-8111-111111111111",
          external_reference: "stage6-live-acceptance-20260902",
          name: "Stage 6 Live Acceptance",
          total_budget_minor: 100,
          sui_treasury_object_id:
            "0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3",
        },
        [
          {
            external_reference: "events",
            name: "Events",
            allocated_minor: 100,
            spent_minor: 0,
          },
        ],
      ),
    ).toEqual({
      treasuryId: "11111111-1111-4111-8111-111111111111",
      externalReference: "stage6-live-acceptance-20260902",
      name: "Stage 6 Live Acceptance",
      totalBudgetMinor: 100,
      treasuryObjectId:
        "0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3",
      categories: [
        {
          externalReference: "events",
          name: "Events",
          allocatedMinor: 100,
          spentMinor: 0,
        },
      ],
    });
  });
});
