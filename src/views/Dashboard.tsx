import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function DashboardPage({ email }: { email: string | undefined }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="hero-glow flex-1">
        <div className="mx-auto w-full max-w-3xl px-5 py-20">
          <h1 className="fade-up text-3xl font-semibold tracking-tight">Hi {email}</h1>
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
