"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/useSession";

// Reads the signed-in user's credit balance (RLS: own profile only). Re-reads on
// every navigation and whenever something dispatches a "credits:changed" event
// (e.g. the post-checkout success page once the webhook has landed).
function useCreditBalance(userId: string | undefined) {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("credits:changed", bump);
    return () => window.removeEventListener("credits:changed", bump);
  }, []);

  useEffect(() => {
    if (!userId) {
      setBalance(null);
      return;
    }
    let active = true;
    createClient()
      .from("profiles")
      .select("credits_balance")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setBalance(data ? Number(data.credits_balance) : null);
      });
    return () => {
      active = false;
    };
  }, [userId, pathname, tick]);

  return balance;
}

export function SiteHeader() {
  const { session, loading } = useSession();
  const router = useRouter();
  const balance = useCreditBalance(session?.user.id);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.replace("/sign-in");
    // Re-render server components so auth-gated pages see the signed-out state.
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            VS
          </span>
          {/* Hidden on the narrowest phones so the nav (with the credits pill) fits. */}
          <span className="hidden min-[420px]:inline">Video Speed Reader</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {loading ? null : session ? (
            <>
              <Link
                href="/app"
                className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Dashboard
              </Link>
              <Link
                href="/upload"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Upload / 上傳
              </Link>
              <Link
                href="/credits"
                title="Your credits — buy more / 你的點數，點擊購買"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium tabular-nums transition-colors hover:bg-secondary"
              >
                <Coins className="size-4 text-status-bonus-foreground" aria-hidden="true" />
                {balance ?? "…"}
                <span className="hidden text-muted-foreground sm:inline">credits · Buy more</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:bg-secondary"
              >
                Sign out / 登出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Sign up
              </Link>
              <Link
                href="/sign-in"
                className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Sign in / 登入
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
