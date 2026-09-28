// SERVER-ONLY Stripe client (STRIPE_SECRET_KEY holds the sandbox secret key in this course).
//
// ⚠️ Never import this file from a "use client" component — the secret key
// must stay on the server. Created lazily (like createAdminClient) so a missing
// env var fails the request that needs Stripe, not the whole Next.js build.
import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Add it in Vercel → Settings → Environment Variables (Production, server-only, never NEXT_PUBLIC_).",
    );
  }
  client = new Stripe(secretKey, {
    // Pinned to the API version that stripe@22.6.2 ships with (package.json pins
    // the exact SDK version too), so an SDK upgrade can't silently change behavior.
    apiVersion: "2026-08-26.dahlia",
  });
  return client;
}
