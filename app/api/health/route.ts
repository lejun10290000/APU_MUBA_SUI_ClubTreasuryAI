import { NextResponse } from "next/server";
import { serverConfig } from "@/src/config/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "clubtreasury-ai",
    stage: 5,
    aiMode: serverConfig.AI_MODE,
    suiNetwork: serverConfig.NEXT_PUBLIC_SUI_NETWORK,
  });
}
