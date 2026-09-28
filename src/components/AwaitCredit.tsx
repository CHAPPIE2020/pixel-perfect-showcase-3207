"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-runs the server component every 2 s (max ~40 s) until the webhook has
// written the purchase row, then tells the header to re-read the balance.
export function AwaitCredit({ credited }: { credited: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (credited) {
      window.dispatchEvent(new Event("credits:changed"));
      return;
    }
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (tries > 20) {
        window.clearInterval(timer);
        return;
      }
      router.refresh();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [credited, router]);

  return null;
}
