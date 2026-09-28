import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AwaitCredit } from "@/components/AwaitCredit";

export function CreditsSuccessPage({
  credited,
  credits,
  balance,
}: {
  credited: boolean;
  credits: number | null;
  balance: number;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="hero-glow flex-1">
        <div className="mx-auto w-full max-w-xl px-5 py-20">
          <div className="fade-up rounded-2xl border border-border bg-card p-8 text-center">
            {credited ? (
              <>
                <CheckCircle2 className="mx-auto size-10 text-status-done-foreground" aria-hidden="true" />
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                  Payment received / 付款成功
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {credits ? `${credits} credits were added. ` : ""}Your balance is now{" "}
                  <span className="font-semibold text-foreground tabular-nums">{balance}</span> credits.
                </p>
              </>
            ) : (
              <>
                <Loader2 className="mx-auto size-10 animate-spin text-muted-foreground" aria-hidden="true" />
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                  Confirming your payment… / 確認付款中…
                </h1>
                <p className="mt-2 text-muted-foreground">
                  This usually takes a few seconds. Your credits appear as soon as Stripe confirms the
                  payment — you can safely leave this page.
                </p>
              </>
            )}
            <AwaitCredit credited={credited} />
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/upload"
                className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Transcribe a video / 送出影片
              </Link>
              <Link
                href="/credits"
                className="rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:bg-secondary"
              >
                View credits / 查看點數
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
