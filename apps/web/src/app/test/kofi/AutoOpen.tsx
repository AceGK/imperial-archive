"use client";

import { useEffect } from "react";

/** With ?open in the URL, clicks the first button inside #targetId on load (for screenshots/QA) */
export default function AutoOpen({ targetId }: { targetId: string }) {
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("open")) return;
    document.querySelector<HTMLButtonElement>(`#${targetId} button`)?.click();
  }, [targetId]);
  return null;
}
