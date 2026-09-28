// Keeps the Supabase session cookie fresh on every request.
// (Next.js 16 prefers the name "proxy.ts"; middleware.ts still works and is
// kept for now so the Supabase docs' snippet copy-pastes cleanly.)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseFetch, getSupabasePublicEnv } from "@/lib/supabase/fetch";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicEnv();

  const supabase = createServerClient(url, publishableKey, {
    global: { fetch: createSupabaseFetch(publishableKey) },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Do not put code between createServerClient and getUser(): getUser()
  // is what triggers the token refresh.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Skip static assets, images, and the Stripe webhook (machine-to-machine:
    // no user cookie, and the raw body must reach the route untouched).
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
