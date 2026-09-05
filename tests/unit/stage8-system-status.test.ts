import { describe, expect, it } from "vitest";
import { describeSystemHealth } from "@/src/lib/system/status";

describe("Stage 8 system status", () => {
  it("summarizes live readiness without secrets", () => {
    const result = describeSystemHealth({
      ok: true,
      ready: true,
      service: "clubtreasury-ai",
      stage: 8,
      readiness: {
        ai: {
          mode: "live",
          model: "gemini-2.5-flash",
          liveRequestsEnabled: true,
          apiKeyConfigured: true,
        },
        claims: { mode: "live", supabaseConfigured: true },
        sui: { network: "testnet", packageConfigured: true },
      },
    });
    expect(result).toEqual({
      overall: "Ready",
      ai: "Live",
      supabase: "Connected",
      sui: "Configured",
    });
  });
});
