import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LANGUAGES = new Set(["zh", "en", "ja"]);

// POST /api/jobs — enqueue a new transcription job for the signed-in user.
export async function POST(req: Request) {
  // 1. Authenticate the caller via the cookie session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Validate the body.
  const body = await req.json().catch(() => ({}));
  const videoUrl = typeof body.video_source_url === "string" ? body.video_source_url.trim() : "";
  if (!videoUrl) {
    return NextResponse.json({ error: "video_source_url required" }, { status: 400 });
  }
  try {
    const parsed = new URL(videoUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    return NextResponse.json({ error: "video_source_url must be an http(s) URL" }, { status: 400 });
  }
  const language = typeof body.language === "string" && LANGUAGES.has(body.language) ? body.language : "zh";
  const topic =
    typeof body.topic === "string" && body.topic.trim() ? body.topic.trim().slice(0, 500) : null;

  // 3. Fast credit floor (M2): reject when the balance is below 1 credit.
  //    The precise "video minutes vs balance" check runs on the worker, which
  //    knows the real duration (yt-dlp / ffprobe) before calling Whisper.
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || Number(profile.credits_balance) < 1) {
    return NextResponse.json(
      { error: "insufficient credits — please buy more at /credits" },
      { status: 402 },
    );
  }

  // 4. Insert job + session with the Secret key. The user was authenticated
  //    above; the Secret key bypasses RLS so we can create both rows and link
  //    them without extra policies.
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .insert({ user_id: user.id, video_source_url: videoUrl, topic, language, status: "pending" })
    .select("id")
    .single();
  if (jobErr || !job) {
    return NextResponse.json({ error: jobErr?.message ?? "insert failed" }, { status: 500 });
  }

  const { data: session, error: sessErr } = await admin
    .from("job_sessions")
    .insert({ job_id: job.id, session_number: 1 })
    .select("id")
    .single();
  if (sessErr || !session) {
    // Don't leave a job without a session behind — the worker would choke on it.
    await admin.from("jobs").delete().eq("id", job.id);
    return NextResponse.json({ error: sessErr?.message ?? "session insert failed" }, { status: 500 });
  }

  const { error: linkErr } = await admin
    .from("jobs")
    .update({ current_session_id: session.id })
    .eq("id", job.id);
  if (linkErr) {
    await admin.from("jobs").delete().eq("id", job.id);
    return NextResponse.json({ error: linkErr.message }, { status: 500 });
  }

  return NextResponse.json({ job_id: job.id });
}
