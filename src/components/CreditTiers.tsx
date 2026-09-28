"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export type CreditTier = {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CreditTiers({ tiers }: { tiers: CreditTier[] }) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Baseline = the smallest pack. Bonus = how many extra credits a tier gives
  // per dollar compared to the baseline ($30 → 45 credits vs 30 at $1/credit = +50%).
  const baseline = tiers.reduce((min, t) => (t.credits < min.credits ? t : min), tiers[0]);
  const baselineCreditsPerUsd = baseline.credits / baseline.priceUsd;

  async function buy(productId: string) {
    setError(null);
    setPurchasingId(productId);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.url) {
        setError(body?.error ?? `Checkout failed (HTTP ${res.status})`);
        setPurchasingId(null);
        return;
      }
      // Keep the buttons disabled while the browser leaves for checkout.stripe.com.
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setPurchasingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((tier) => {
          const usdPerCredit = tier.priceUsd / tier.credits;
          const bonusPct = Math.round(
            (tier.credits / (tier.priceUsd * baselineCreditsPerUsd) - 1) * 100,
          );
          return (
            <div key={tier.id} className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold tracking-tight">{tier.name}</h3>
                {bonusPct > 0 ? (
                  <span className="rounded-full bg-status-done px-2.5 py-0.5 text-xs font-semibold text-status-done-foreground">
                    +{bonusPct}%
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                {usd.format(tier.priceUsd)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {usd.format(usdPerCredit)} / credit · {tier.credits} min of video
              </p>
              <button
                type="button"
                onClick={() => buy(tier.id)}
                disabled={purchasingId !== null}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {purchasingId === tier.id ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Redirecting…
                  </>
                ) : (
                  "Buy / 購買"
                )}
              </button>
            </div>
          );
        })}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
