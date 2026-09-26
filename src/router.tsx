import { createBrowserRouter, Navigate } from "react-router";

import { RootLayout, RouteErrorBoundary, NotFoundPage } from "@/components/RootLayout";
import { RequireAuth } from "@/components/RequireAuth";
import { LandingPage } from "@/pages/Landing";
import { SignInPage } from "@/pages/SignIn";
import { SignUpPage } from "@/pages/SignUp";
import { DashboardPage } from "@/pages/Dashboard";

// Client-side routes. The static host serves index.html for every path
// (see vercel.json), and React Router resolves the URL in the browser.
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/signin", element: <SignInPage /> },
      { path: "/signup", element: <SignUpPage /> },
      // Hyphenated aliases for convenience.
      { path: "/sign-in", element: <Navigate to="/signin" replace /> },
      { path: "/sign-up", element: <Navigate to="/signup" replace /> },
      {
        element: <RequireAuth />,
        children: [{ path: "/app", element: <DashboardPage /> }],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
