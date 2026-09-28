-- Jobs that fail (download blocked, unreadable file, transcription error) get a
-- terminal 'failed' status plus a human-readable reason instead of being left in
-- 'downloading' / 'transcribe' forever. Failed jobs are never charged.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS error_message text;

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('pending', 'downloading', 'transcribe', 'done', 'insufficient_credits', 'failed'));
