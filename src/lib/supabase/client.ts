"use client";

// Browser-side Supabase client. @supabase/ssr stores the session in cookies
// (not localStorage), so server components, route handlers and middleware can
// read the same session.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch, getSupabasePublicEnv } from "./fetch";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

// Import like this:
//   import { createClient } from "@/lib/supabase/client";
//   const supabase = createClient();
export function createClient() {
  if (browserClient) return browserClient;
  const { url, publishableKey } = getSupabasePublicEnv();
  browserClient = createBrowserClient<Database>(url, publishableKey, {
    global: { fetch: createSupabaseFetch(publishableKey) },
  });
  return browserClient;
}
