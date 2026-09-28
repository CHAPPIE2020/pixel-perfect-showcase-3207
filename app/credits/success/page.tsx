import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { CreditsSuccessPage } from "@/views/CreditsSuccess";

export const metadata: Metadata = {
  title: "Payment received — Video Speed Reader",
  robots: { index: false },
};

// UX-only landing page after Stripe Checkout. It NEVER grants credits — the
// Stripe webhook (/api/stripe/webhook) is the only thing that does. This page
// just shows whether the webhook has landed yet and refreshes until it has.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { session_id: sessionId } = await searchParams;

  let credits: number | null = null;
  let paymentIntentId: string | null = null;
  if (sessionId?.startsWith("cs_")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      // Only show details for the signed-in user's own checkout.
      if (session.client_reference_id === user.id) {
        credits = Number(session.metadata?.credits) || null;
        paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);
      }
    } catch {
      // Unknown / foreign session id — fall through to the generic message.
    }
  }

  let credited = false;
  if (paymentIntentId) {
    const { data } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("stripe_payment_intent_id", paymentIntentId)
      .maybeSingle();
    credited = Boolean(data);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <CreditsSuccessPage
      credited={credited}
      credits={credits}
      balance={Number(profile?.credits_balance ?? 0)}
    />
  );
}
