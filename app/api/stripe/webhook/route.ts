import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe → us. Machine-to-machine: no user cookie, so middleware.ts excludes
// this path, and all DB writes use the Secret-key (service-role) client.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 1. RAW body — the signature is computed over the exact bytes. Never .json() first.
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("no signature", { status: 400 });
  }

  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new NextResponse("webhook secret not configured", { status: 500 });
  }

  // 2. Verify the signature BEFORE acknowledging anything.
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("webhook signature verification failed", err);
    return new NextResponse("invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, unpaid: true });
  }

  const userId = session.metadata?.["user_id"];
  const productId = session.metadata?.["product_id"];
  const credits = Number(session.metadata?.["credits"]);
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!userId || !productId || !credits || !paymentIntentId) {
    console.error("missing required fields", { userId, productId, credits, paymentIntentId });
    return new NextResponse("missing metadata", { status: 400 });
  }

  const admin = createAdminClient();

  // 3. Ledger row first (source of truth). The UNIQUE index on
  //    stripe_payment_intent_id makes a retried delivery fail with 23505.
  const { error: insertErr } = await admin.from("credit_transactions").insert({
    user_id: userId,
    amount: credits,
    type: "purchase",
    description: `Purchased ${credits} credits`,
    stripe_payment_intent_id: paymentIntentId,
  });
  if (insertErr) {
    if (insertErr.code === "23505") {
      // Already processed this payment — idempotency working. 200 so Stripe stops retrying.
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("credit_transactions insert failed", insertErr);
    return new NextResponse("db insert failed", { status: 500 });
  }

  // 4. Derived balance. If this fails the ledger is still right; fix with
  //    UPDATE profiles SET credits_balance = (SELECT SUM(amount) FROM credit_transactions WHERE user_id = …).
  const { data: profile, error: readErr } = await admin
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();
  if (readErr || !profile) {
    console.error("profile read failed", readErr ?? "no profile row", { userId });
    return new NextResponse("profile read failed", { status: 500 });
  }
  const newBalance = Number(profile.credits_balance) + credits;
  const { error: updateErr } = await admin
    .from("profiles")
    .update({ credits_balance: newBalance })
    .eq("id", userId);
  if (updateErr) {
    console.error("balance update failed", updateErr);
    return new NextResponse("balance update failed", { status: 500 });
  }

  console.log("credited", { userId, credits, paymentIntentId, newBalance });
  return NextResponse.json({ received: true, credited: credits });
}
