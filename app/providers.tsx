"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const SuiDAppKitClientProvider = dynamic(
  () =>
    import("@/src/components/sui-dapp-kit-client-provider").then(
      (module) => module.SuiDAppKitClientProvider,
    ),
  { ssr: false },
);

export function AppProviders({ children }: { children: ReactNode }) {
  return <SuiDAppKitClientProvider>{children}</SuiDAppKitClientProvider>;
}
