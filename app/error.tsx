"use client";

import { RouteErrorPage } from "@/views/RouteError";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <RouteErrorPage error={error} reset={reset} />;
}
