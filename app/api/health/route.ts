import { NextResponse } from "next/server";
import { serverConfig } from "@/src/config/env";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  const aiReady =
    serverConfig.AI_MODE === "mock" ||
    (serverConfig.GEMINI_LIVE_REQUESTS_ENABLED &&
      Boolean(serverConfig.GEMINI_API_KEY));
  const supabaseConfigured =
    serverConfig.NEXT_PUBLIC_CLAIM_DATA_MODE === "live" &&
    Boolean(
      serverConfig.NEXT_PUBLIC_SUPABASE_URL &&
        serverConfig.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
        serverConfig.SUPABASE_SECRET_KEY,
    );
  const claimsReady =
    serverConfig.NEXT_PUBLIC_CLAIM_DATA_MODE === "mock" || supabaseConfigured;
  const packageConfigured = Boolean(serverConfig.NEXT_PUBLIC_SUI_PACKAGE_ID);

  return NextResponse.json(
    {
      ok: true,
      ready: aiReady && claimsReady && packageConfigured,
      service: "clubtreasury-ai",
      stage: 7,
      readiness: {
        ai: {
          mode: serverConfig.AI_MODE,
          liveRequestsEnabled: serverConfig.GEMINI_LIVE_REQUESTS_ENABLED,
          apiKeyConfigured: Boolean(serverConfig.GEMINI_API_KEY),
        },
        claims: {
          mode: serverConfig.NEXT_PUBLIC_CLAIM_DATA_MODE,
          supabaseConfigured,
        },
        sui: {
          network: serverConfig.NEXT_PUBLIC_SUI_NETWORK,
          packageConfigured,
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
