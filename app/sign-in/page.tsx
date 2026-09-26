import type { Metadata } from "next";
import { SignInPage } from "@/views/SignIn";

export const metadata: Metadata = {
  title: "Sign in — Video Speed Reader",
  description: "Sign in to Video Speed Reader with your email and password.",
  openGraph: {
    title: "Sign in — Video Speed Reader",
    description: "Sign in to your Video Speed Reader account.",
  },
};

export default function Page() {
  return <SignInPage />;
}
