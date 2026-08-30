import { NextResponse } from "next/server";
import { publicConfig } from "@/src/config/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "clubtreasury-ai",
    stage: 5,
    aiMode: publicConfig.aiMode,
    suiNetwork: publicConfig.suiNetwork,
  });
}
