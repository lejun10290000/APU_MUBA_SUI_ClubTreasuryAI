import "server-only";

import { createClient } from "@supabase/supabase-js";
import { serverConfig } from "@/src/config/env";
import type { Database } from "./database.types";

export function createAdminSupabaseClient() {
  const url = serverConfig.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = serverConfig.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Supabase server-only administration configuration is missing.",
    );
  }
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
