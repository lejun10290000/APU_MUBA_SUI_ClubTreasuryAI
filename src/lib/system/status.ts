export interface SystemHealthResponse {
  ok: boolean;
  ready: boolean;
  service: string;
  stage: number;
  readiness: {
    ai: {
      mode: "mock" | "live";
      model: string;
      liveRequestsEnabled: boolean;
      apiKeyConfigured: boolean;
    };
    claims: {
      mode: "mock" | "live";
      supabaseConfigured: boolean;
    };
    sui: {
      network: string;
      packageConfigured: boolean;
    };
  };
}

export function describeSystemHealth(health: SystemHealthResponse) {
  return {
    overall: health.ready ? "Ready" : "Attention required",
    ai:
      health.readiness.ai.mode === "live" &&
      health.readiness.ai.liveRequestsEnabled &&
      health.readiness.ai.apiKeyConfigured
        ? "Live"
        : health.readiness.ai.mode === "mock"
          ? "Mock"
          : "Unavailable",
    supabase: health.readiness.claims.supabaseConfigured
      ? "Connected"
      : health.readiness.claims.mode === "mock"
        ? "Mock"
        : "Not configured",
    sui: health.readiness.sui.packageConfigured
      ? "Configured"
      : "Not configured",
  } as const;
}
