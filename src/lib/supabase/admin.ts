// SERVER-ONLY Supabase client that uses the Secret key (sb_secret_*).
//
// ⚠️ This key bypasses Row Level Security — it has full access to the
// database. Only import this file from Route Handlers / Server Components,
// never from a "use client" file, and always re-apply the per-user filter
// yourself (e.g. `.eq("user_id", user.id)`) before returning data.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch, getSupabasePublicEnv } from "./fetch";

export function createAdminClient() {
  const { url } = getSupabasePublicEnv();
  const secretKey = process.env["SUPABASE_SECRET_KEY"];
  if (!secretKey) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY. Add it in Vercel → Settings → Environment Variables (server-only, never NEXT_PUBLIC_).",
    );
  }
  return createClient<Database>(url, secretKey, {
    global: { fetch: createSupabaseFetch(secretKey) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
