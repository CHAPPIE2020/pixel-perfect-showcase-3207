import { useEffect } from "react";

type PageMeta = {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  robots?: string;
};

function setMeta(attr: "name" | "property", key: string, content: string | undefined) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (content === undefined) {
    // Only remove tags this hook created; leave the static defaults from index.html alone.
    if (el?.dataset["pageMeta"] === "true") el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.dataset["pageMeta"] = "true";
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Client-side replacement for TanStack Router's per-route `head()`.
export function usePageMeta({ title, description, ogTitle, ogDescription, robots }: PageMeta) {
  useEffect(() => {
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", ogTitle ?? title);
    setMeta("property", "og:description", ogDescription ?? description);
    setMeta("name", "robots", robots);
  }, [title, description, ogTitle, ogDescription, robots]);
}
