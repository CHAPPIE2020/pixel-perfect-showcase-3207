-- Summary feature: store a ChatGPT-generated summary next to the transcript.
-- Generated on demand from /upload (POST /api/jobs/[id]/summary) and cached
-- here so each video is only summarized (and billed) once.
alter table public.job_sessions
  add column summary_content text,
  add column summary_created_at timestamptz;
