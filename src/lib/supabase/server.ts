import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverConfig } from "@/src/config/env";
import type { Database } from "./database.types";

export async function createServerSupabaseClient() {
  const url = serverConfig.NEXT_PUBLIC_SUPABASE_URL;
  const key = serverConfig.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase server configuration is missing.");
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

export async function requireSupabaseUserId(
  client: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<string> {
  const { data, error } = await client.auth.getClaims();
  const userId = data?.claims.sub;
  if (error || !userId) {
    throw new Error("Authenticate the connected wallet before continuing.");
  }
  return userId;
}
