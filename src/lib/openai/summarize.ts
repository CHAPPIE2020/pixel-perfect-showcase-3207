// SERVER-ONLY: turns a transcript into a short summary with the OpenAI API.
// Reads OPENAI_API_KEY (and optionally OPENAI_SUMMARY_MODEL) from the server
// environment. Never import this from a "use client" file.

const DEFAULT_MODEL = "gpt-5.4-mini";

// Keep very long transcripts affordable: ~120k characters is roughly
// 30k tokens, i.e. a few US cents at most per summary.
const MAX_TRANSCRIPT_CHARS = 120_000;

// The summary is written in the same language as the video.
const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  zh: "請用繁體中文撰寫。",
  en: "Write in English.",
  ja: "日本語で書いてください。",
};

const SYSTEM_PROMPT = `You summarize video transcripts for busy readers.
Output plain text only (no Markdown headings, no bold), in this shape:
1. One or two sentences describing what the video is about.
2. A blank line.
3. 3 to 6 bullet points, each starting with "- ", covering the key points in the order they appear.
Be faithful to the transcript: do not invent facts, names or numbers.`;

export async function summarizeTranscript(transcript: string, language: string): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it in Vercel → Settings → Environment Variables (server-only, never NEXT_PUBLIC_).",
    );
  }
  const model = process.env["OPENAI_SUMMARY_MODEL"] || DEFAULT_MODEL;
  const truncated = transcript.length > MAX_TRANSCRIPT_CHARS;
  const text = truncated ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) : transcript;
  const languageRule = LANGUAGE_INSTRUCTIONS[language] ?? "Write in the same language as the transcript.";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      reasoning_effort: "low",
      max_completion_tokens: 2000,
      messages: [
        { role: "system", content: `${SYSTEM_PROMPT}\n${languageRule}` },
        {
          role: "user",
          content: `Transcript${truncated ? " (truncated — summarize what is here)" : ""}:\n\n${text}`,
        },
      ],
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.error?.message ?? `OpenAI request failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  const summary: string | undefined = body?.choices?.[0]?.message?.content?.trim();
  if (!summary) {
    throw new Error("OpenAI returned an empty summary");
  }
  return summary;
}
