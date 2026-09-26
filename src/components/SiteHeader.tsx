import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

export function SiteHeader() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/signin", { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            VS
          </span>
          Video Speed Reader
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {loading ? null : session ? (
            <>
              <Link
                to="/app"
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
                to="/signup"
                className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Sign up
              </Link>
              <Link
                to="/signin"
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
