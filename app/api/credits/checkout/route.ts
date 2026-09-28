import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// POST /api/credits/checkout — create a Stripe Checkout Session for one credit pack.
// Body: { product_id } (credit_products.id). Returns { url } to redirect to.
export async function POST(req: Request) {
  // 1. Authenticate the caller via the cookie session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Validate the body.
  const body = await req.json().catch(() => ({}));
  const productId = typeof body.product_id === "string" ? body.product_id : "";
  if (!productId) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  // 3. Look up the pack. Credits-per-pack lives in Supabase, never trusted from the client.
  const { data: product } = await supabase
    .from("credit_products")
    .select("id, credits, stripe_price_id, active")
    .eq("id", productId)
    .maybeSingle();
  if (!product || !product.active || !product.stripe_price_id) {
    return NextResponse.json({ error: "unknown or inactive credit pack" }, { status: 400 });
  }

  // 4. Build return URLs from the request origin so the same code works on the
  //    Vercel URL today and on a custom domain (M3) later.
  const origin =
    req.headers.get("origin") ?? process.env["NEXT_PUBLIC_SITE_URL"] ?? new URL(req.url).origin;

  // 5. Create the Checkout Session. The webhook reads user_id / product_id /
  //    credits back from metadata (Stripe metadata values are always strings).
  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: product.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits?canceled=1`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        product_id: product.id,
        credits: String(product.credits),
      },
    });
  } catch (err) {
    console.error("stripe checkout.sessions.create failed", err);
    return NextResponse.json({ error: "could not start checkout" }, { status: 502 });
  }

  if (!session.url) {
    return NextResponse.json({ error: "checkout session has no url" }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}
