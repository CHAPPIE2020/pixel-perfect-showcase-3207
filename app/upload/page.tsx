import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadPage } from "@/views/Upload";

export const metadata: Metadata = {
  title: "Upload — Video Speed Reader",
  description: "Submit a video and track your transcriptions.",
  robots: { index: false },
};

// Auth-gated on the server: no session cookie → /sign-in.
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // RLS ("users read own jobs") already limits rows to this user;
  // the explicit user_id filter keeps the intent obvious.
  // The summary lives on the job's current session. There are two foreign keys
  // between jobs and job_sessions, so name the one to follow (fk_current_session).
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, created_at, video_source_url, status, current_session:job_sessions!fk_current_session(summary_content)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const jobs = (data ?? []).map((job) => {
    const session = Array.isArray(job.current_session) ? job.current_session[0] : job.current_session;
    return {
      id: job.id,
      created_at: job.created_at,
      video_source_url: job.video_source_url,
      status: job.status,
      summary: session?.summary_content ?? null,
    };
  });

  return <UploadPage jobs={jobs} loadError={error?.message ?? null} />;
}
