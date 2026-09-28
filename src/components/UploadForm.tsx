"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-ring";

export function UploadForm() {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("zh");
  const [error, setError] = useState<string | null>(null);
  const [needsCredits, setNeedsCredits] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNeedsCredits(false);
    setBusy(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_source_url: videoUrl, topic: topic || null, language }),
      });
      if (res.status === 402) {
        setNeedsCredits(true);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `Request failed (HTTP ${res.status})`);
        return;
      }
      setVideoUrl("");
      setTopic("");
      // Re-run the server component so the new job shows up in the list above.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block text-sm">
        <span className="text-muted-foreground">Video URL</span>
        <input
          type="url"
          required
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className={inputClass}
          placeholder="Direct mp4 / mp3 URL (e.g. CloudFront, Vimeo, Internet Archive)"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          YouTube links aren't supported yet. / 目前不支援 YouTube 連結。
        </span>
      </label>

      <label className="block text-sm">
        <span className="text-muted-foreground">Topic (optional)</span>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={inputClass}
          placeholder="e.g. Tech podcast — useful context for the model"
        />
      </label>

      <label className="block text-sm">
        <span className="text-muted-foreground">Language</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
          <option value="zh">zh — 中文</option>
          <option value="en">en — English</option>
          <option value="ja">ja — 日本語</option>
        </select>
      </label>

      {needsCredits ? (
        <p className="text-sm text-destructive">
          You don't have enough credits. / 點數不足。{" "}
          <Link href="/credits" className="font-medium underline">
            Buy credits / 購買點數
          </Link>
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {busy ? "Submitting…" : "Transcribe"}
      </button>
    </form>
  );
}
