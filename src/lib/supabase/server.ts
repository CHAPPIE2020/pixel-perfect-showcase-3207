// Server-side Supabase client for Server Components and Route Handlers.
// Reads (and, where allowed, refreshes) the user's session from cookies.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch, getSupabasePublicEnv } from "./fetch";

// Import like this:
//   import { createClient } from "@/lib/supabase/server";
//   const supabase = await createClient();
export async function createClient() {
  // cookies() is async since Next.js 15 — it must be awaited.
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicEnv();

  return createServerClient<Database>(url, publishableKey, {
    global: { fetch: createSupabaseFetch(publishableKey) },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: middleware.ts refreshes the session cookie.
        }
      },
    },
  });
}
