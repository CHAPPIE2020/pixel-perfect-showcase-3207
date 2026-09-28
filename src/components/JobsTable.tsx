"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp, Download, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type JobTableRow = {
  id: string;
  createdLabel: string; // relative time, computed on the server ("3 minutes ago")
  video_source_url: string;
  status: string;
  summary: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-status-idle text-status-idle-foreground",
  downloading: "bg-status-idle text-status-idle-foreground",
  transcribe: "bg-status-active text-status-active-foreground",
  done: "bg-status-done text-status-done-foreground",
  insufficient_credits: "bg-status-blocked text-status-blocked-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  insufficient_credits: "insufficient credits",
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
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

type SummaryState = {
  summary: string | null;
  open: boolean;
  loading: boolean;
  error: string | null;
};

export function JobsTable({ jobs }: { jobs: JobTableRow[] }) {
  const [state, setState] = useState<Record<string, SummaryState>>(() =>
    Object.fromEntries(
      jobs.map((j) => [j.id, { summary: j.summary, open: false, loading: false, error: null }]),
    ),
  );

  function patch(id: string, next: Partial<SummaryState>) {
    setState((prev) => {
      const current = prev[id] ?? { summary: null, open: false, loading: false, error: null };
      return { ...prev, [id]: { ...current, ...next } };
    });
  }

  async function summarize(id: string) {
    patch(id, { loading: true, error: null });
    try {
      const res = await fetch(`/api/jobs/${id}/summary`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.summary) {
        patch(id, { loading: false, error: body?.error ?? `Request failed (HTTP ${res.status})`, open: true });
        return;
      }
      patch(id, { loading: false, summary: body.summary, open: true });
    } catch (err) {
      patch(id, { loading: false, error: err instanceof Error ? err.message : "Network error", open: true });
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-medium">Created</th>
            <th className="px-5 py-3 font-medium">URL</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Transcript</th>
            <th className="px-5 py-3 font-medium">Summary</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const s = state[job.id] ?? { summary: job.summary, open: false, loading: false, error: null };
            const showPanel = s.open && (s.summary || s.error);
            return (
              <Fragment key={job.id}>
                <tr className={cn("border-b border-border", showPanel && "border-b-0")}>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{job.createdLabel}</td>
                  <td className="max-w-[18rem] truncate px-5 py-3" title={job.video_source_url}>
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
                  <td className="whitespace-nowrap px-5 py-3">
                    {job.status !== "done" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : s.loading ? (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Summarizing…
                      </span>
                    ) : s.summary ? (
                      <button
                        type="button"
                        onClick={() => patch(job.id, { open: !s.open })}
                        aria-expanded={s.open}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        {s.open ? "Hide" : "View"}
                        {s.open ? (
                          <ChevronUp className="size-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => summarize(job.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 font-medium text-primary transition-colors hover:bg-secondary"
                      >
                        <Sparkles className="size-4" aria-hidden="true" />
                        Summarize
                      </button>
                    )}
                  </td>
                </tr>
                {showPanel ? (
                  <tr className="border-b border-border last:border-0">
                    <td colSpan={5} className="px-5 pb-4 pt-0">
                      {s.error ? (
                        <p className="rounded-lg border border-border bg-background/60 p-4 text-sm text-destructive sticky left-5 w-[calc(min(100vw,64rem)-5.25rem)]">
                          Couldn't create the summary: {s.error}
                        </p>
                      ) : (
                        <div className="rounded-lg border border-border bg-background/60 p-4 sticky left-5 w-[calc(min(100vw,64rem)-5.25rem)]">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Summary / 摘要
                          </p>
                          <p className="whitespace-pre-line leading-relaxed">{s.summary}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
