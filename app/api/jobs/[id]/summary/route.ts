import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { summarizeTranscript } from "@/lib/openai/summarize";

// Summaries of long transcripts can take a little while.
export const maxDuration = 60;

// POST /api/jobs/[id]/summary — create (once) and return the video summary.
// The first call asks ChatGPT and saves the result in
// job_sessions.summary_content; later calls return the saved summary, so each
// video is only billed once.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Auth — same cookie-session pattern as the other /api/jobs routes.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  // 2. Job lookup + ownership check (the Secret key bypasses RLS).
  const { data: job } = await admin
    .from("jobs")
    .select("id, status, language, current_session_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!job) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (job.status !== "done" || !job.current_session_id) {
    return NextResponse.json({ error: "transcript not ready yet" }, { status: 409 });
  }

  const { data: session } = await admin
    .from("job_sessions")
    .select("subtitle_txt_content, summary_content")
    .eq("id", job.current_session_id)
    .single();
  if (session?.summary_content) {
    return NextResponse.json({ summary: session.summary_content, cached: true });
  }
  const transcript = session?.subtitle_txt_content;
  if (!transcript) {
    return NextResponse.json({ error: "transcript missing" }, { status: 500 });
  }

  // 3. Ask ChatGPT, then save the result.
  let summary: string;
  try {
    summary = await summarizeTranscript(transcript, job.language);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  const { error: saveErr } = await admin
    .from("job_sessions")
    .update({ summary_content: summary, summary_created_at: new Date().toISOString() })
    .eq("id", job.current_session_id);
  if (saveErr) {
    // Still hand the summary back; it just won't be cached.
    return NextResponse.json({ summary, cached: false, warning: saveErr.message });
  }

  return NextResponse.json({ summary, cached: false });
}
