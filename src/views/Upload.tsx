import { formatDistanceToNowStrict } from "date-fns";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UploadForm } from "@/components/UploadForm";
import { JobsTable } from "@/components/JobsTable";

export type JobRow = {
  id: string;
  created_at: string;
  video_source_url: string;
  status: string;
  summary: string | null;
};

export function UploadPage({ jobs, loadError }: { jobs: JobRow[]; loadError: string | null }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="hero-glow flex-1">
        <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-16">
          <h1 className="fade-up text-3xl font-semibold tracking-tight">Your transcriptions / 我的逐字稿</h1>

          {/* (a) Jobs list */}
          <section
            className="fade-up overflow-hidden rounded-2xl border border-border bg-card"
            style={{ animationDelay: "80ms" }}
          >
            {loadError ? (
              <p className="p-6 text-sm text-destructive">Couldn't load your jobs: {loadError}</p>
            ) : jobs.length === 0 ? (
              <p className="p-6 text-muted-foreground">
                No transcriptions yet. Submit your first video below.
              </p>
            ) : (
              <JobsTable
                jobs={jobs.map((job) => ({
                  id: job.id,
                  createdLabel: formatDistanceToNowStrict(new Date(job.created_at), { addSuffix: true }),
                  video_source_url: job.video_source_url,
                  status: job.status,
                  summary: job.summary,
                }))}
              />
            )}
          </section>

          {/* (b) Submission form */}
          <section
            className="fade-up rounded-2xl border border-border bg-card p-6"
            style={{ animationDelay: "160ms" }}
          >
            <h2 className="text-lg font-semibold tracking-tight">Transcribe a video / 送出影片</h2>
            <UploadForm />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
