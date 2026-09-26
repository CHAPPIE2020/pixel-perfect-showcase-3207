import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Video Speed Reader — 上傳影片，三分鐘內拿到逐字稿" },
      {
        name: "description",
        content:
          "Upload your video and get a clean, high-accuracy transcript in three minutes. Built for creators, educators, and engineers.",
      },
      { property: "og:title", content: "Video Speed Reader — transcripts in three minutes" },
      {
        property: "og:description",
        content:
          "Upload your video and get a clean, high-accuracy transcript in three minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    title: "高準確度逐字稿",
    subtitle: "High-accuracy transcripts",
    body: "Powered by OpenAI Whisper, with solid support for both Chinese and English audio.",
  },
  {
    title: "三分鐘交付",
    subtitle: "Three-minute turnaround",
    body: "Your video is processed in the background — we email you the moment it's ready.",
  },
  {
    title: "可商用授權",
    subtitle: "Commercial-use ready",
    body: "You own the output. Publish it, sell it, or fold it into your own products.",
  },
];

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="hero-glow relative overflow-hidden">
          <div className="mx-auto w-full max-w-4xl px-5 py-28 text-center sm:py-36">
            <p className="fade-up text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Video Speed Reader
            </p>
            <h1
              className="fade-up mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              上傳影片，三分鐘內拿到逐字稿。
            </h1>
            <p
              className="fade-up mx-auto mt-5 max-w-2xl text-lg text-muted-foreground"
              style={{ animationDelay: "160ms" }}
            >
              Upload your video, get a clean transcript in three minutes.
            </p>
            <div className="fade-up mt-10" style={{ animationDelay: "240ms" }}>
              <Link
                to="/signup"
                className="glow-shadow inline-flex items-center rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Get started free
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-28">
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((feature, i) => (
              <article
                key={feature.title}
                className="fade-up rounded-2xl border border-border bg-card p-6"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <h2 className="text-lg font-semibold tracking-tight">{feature.title}</h2>
                <p className="mt-1 text-sm font-medium text-primary">{feature.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
