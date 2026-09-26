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
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, created_at, video_source_url, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return <UploadPage jobs={jobs ?? []} loadError={error?.message ?? null} />;
}
