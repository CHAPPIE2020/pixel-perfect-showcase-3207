import type { Metadata } from "next";
import { SignUpPage } from "@/views/SignUp";

export const metadata: Metadata = {
  title: "Create your account — Video Speed Reader",
  description: "Create a Video Speed Reader account and start turning videos into transcripts.",
  openGraph: {
    title: "Create your account — Video Speed Reader",
    description: "Sign up with email and password to start transcribing your videos.",
  },
};

export default function Page() {
  return <SignUpPage />;
}
