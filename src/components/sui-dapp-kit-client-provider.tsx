"use client";

import { DAppKitProvider } from "@mysten/dapp-kit-react";
import type { ReactNode } from "react";
import { dAppKit } from "@/src/lib/sui/dapp-kit";

export function SuiDAppKitClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <DAppKitProvider dAppKit={dAppKit}>{children}</DAppKitProvider>;
}
