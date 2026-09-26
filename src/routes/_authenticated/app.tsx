import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — Video Speed Reader" },
      { name: "description", content: "Your Video Speed Reader dashboard." },
      { property: "og:title", content: "Dashboard — Video Speed Reader" },
      { property: "og:description", content: "Your Video Speed Reader dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="hero-glow flex-1">
        <div className="mx-auto w-full max-w-3xl px-5 py-20">
          <h1 className="fade-up text-3xl font-semibold tracking-tight">Hi {user.email}</h1>
          <div
            className="fade-up mt-6 rounded-2xl border border-border bg-card p-6 text-muted-foreground"
            style={{ animationDelay: "100ms" }}
          >
            Your dashboard is coming soon. Upload functionality will be added in the next
            milestone.
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
