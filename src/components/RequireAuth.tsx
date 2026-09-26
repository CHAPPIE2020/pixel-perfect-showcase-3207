import { useEffect, useState } from "react";
import { Navigate, Outlet, useOutletContext } from "react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState =
  { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; user: User };

// Client-side auth guard (replaces the former `_authenticated` layout route).
// Verifies the user with Supabase and redirects to /signin when there is no session.
export function RequireAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function check() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      setState(
        error || !data.user ? { status: "signed-out" } : { status: "signed-in", user: data.user },
      );
    }

    check();

    // Re-check when auth changes (e.g. sign-out in another tab).
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      check();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") return null;
  if (state.status === "signed-out") return <Navigate to="/signin" replace />;
  return <Outlet context={{ user: state.user } satisfies AuthContext} />;
}

type AuthContext = { user: User };

export function useAuthUser(): User {
  return useOutletContext<AuthContext>().user;
}
