import { formatDistanceToNowStrict } from "date-fns";
import { Download } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UploadForm } from "@/components/UploadForm";
import { cn } from "@/lib/utils";

export type JobRow = {
  id: string;
  created_at: string;
  video_source_url: string;
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-status-idle text-status-idle-foreground",
  downloading: "bg-status-idle text-status-idle-foreground",
  transcribe: "bg-status-active text-status-active-foreground",
  done: "bg-status-done text-status-done-foreground",
};

function truncate(text: string, max = 50) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? STATUS_STYLES["pending"],
      )}
    >
      {status}
    </span>
  );
}

export function UploadPage({ jobs, loadError }: { jobs: JobRow[]; loadError: string | null }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="hero-glow flex-1">
        <div className="mx-auto w-full max-w-4xl space-y-8 px-5 py-16">
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Created</th>
                      <th className="px-5 py-3 font-medium">URL</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Transcript</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                          {formatDistanceToNowStrict(new Date(job.created_at), { addSuffix: true })}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3" title={job.video_source_url}>
                          {truncate(job.video_source_url)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-5 py-3">
                          {job.status === "done" ? (
                            <a
                              href={`/api/jobs/${job.id}/transcript`}
                              download={`transcript-${job.id.slice(0, 8)}.txt`}
                              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                            >
                              <Download className="size-4" aria-hidden="true" />
                              .txt
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
