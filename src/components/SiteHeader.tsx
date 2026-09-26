"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/useSession";

export function SiteHeader() {
  const { session, loading } = useSession();
  const router = useRouter();

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
          Video Speed Reader
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
