import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * The Clerk session token is the only credential Supabase sees. Passing it as
 * `accessToken` puts the organization claim on every request, so a row-level
 * policy can read it without the application asking Clerk anything at query
 * time.
 */
export async function createSupabaseServerClient() {
  const { getToken } = await auth();

  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    accessToken: async () => (await getToken()) ?? null,
    // Clerk owns the session. Supabase must not persist or refresh one of its
    // own alongside it.
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
