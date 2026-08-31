"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicConfig } from "@/src/config/public-env";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | undefined;

export function getBrowserSupabaseClient(): SupabaseClient<Database> {
  if (!publicConfig.supabaseUrl || !publicConfig.supabasePublishableKey) {
    throw new Error("Supabase browser configuration is missing.");
  }
  browserClient ??= createBrowserClient<Database>(
    publicConfig.supabaseUrl,
    publicConfig.supabasePublishableKey,
  );
  return browserClient;
}
