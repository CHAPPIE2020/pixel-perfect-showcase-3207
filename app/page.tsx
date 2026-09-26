import type { Metadata } from "next";
import { LandingPage } from "@/views/Landing";

export const metadata: Metadata = {
  title: "Video Speed Reader — 上傳影片，三分鐘內拿到逐字稿",
  description:
    "Upload your video and get a clean, high-accuracy transcript in three minutes. Built for creators, educators, and engineers.",
  openGraph: {
    title: "Video Speed Reader — transcripts in three minutes",
    description: "Upload your video and get a clean, high-accuracy transcript in three minutes.",
  },
};

export default function Page() {
  return <LandingPage />;
}
