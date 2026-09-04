import { describe, expect, it } from "vitest";
import { mapPersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";

describe("A2 activation mapping", () => {
  it("does not expose a join code before full Sui activation", () => {
    const workspace = mapPersistedTreasuryWorkspace({
      treasury: {
        id: "t1",
        owner_user_id: "u1",
        external_reference: "apu-event-live",
        name: "APU Event Live",
        currency: "USDC",
        total_budget_minor: 1000,
        sui_treasury_object_id: null,
        sui_treasurer_cap_object_id: null,
        sui_activation_status: "not_started",
        budget_locked_at: null,
        activated_at: null,
        join_code: "ABCD-123456",
        status: "active",
        created_at: "2026-09-05T00:00:00Z",
        updated_at: "2026-09-05T00:00:00Z",
      },
      categories: [],
      role: "owner",
      activation: null,
    });

    expect(workspace.joinCode).toBeUndefined();
    expect(workspace.suiActivationStatus).toBe("not_started");
    expect(workspace.activation).toBeNull();
  });
});
