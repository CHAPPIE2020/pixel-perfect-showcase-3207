import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreditsPage } from "@/views/Credits";

export const metadata: Metadata = {
  title: "Credits — Video Speed Reader",
  description: "Your credit balance, credit packs and transaction history.",
  robots: { index: false },
};

// Auth-gated on the server: no session cookie → /sign-in.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // RLS limits every query below to this user's own rows (products: any signed-in user).
  const [{ data: profile }, { data: products }, { data: transactions }] = await Promise.all([
    supabase.from("profiles").select("credits_balance").eq("id", user.id).maybeSingle(),
    supabase
      .from("credit_products")
      .select("id, name, credits, price_usd")
      .eq("active", true)
      .order("price_usd"),
    supabase
      .from("credit_transactions")
      .select("id, amount, type, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const { canceled } = await searchParams;

  return (
    <CreditsPage
      balance={Number(profile?.credits_balance ?? 0)}
      products={(products ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        credits: Number(p.credits),
        priceUsd: Number(p.price_usd),
      }))}
      transactions={(transactions ?? []).map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        description: t.description,
        createdAt: t.created_at,
      }))}
      canceled={canceled === "1"}
    />
  );
}
