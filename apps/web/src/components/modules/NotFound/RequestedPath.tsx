"use client";

import { usePathname } from "next/navigation";
import { typedChars } from "./typist";

/**
 * The address the reader tried to open, typed out in the 404 readout. Paths
 * vary in length, so it types within a fixed time budget instead of a fixed
 * speed, which keeps the lines after it on schedule.
 */
export default function RequestedPath({ start, duration }: { start: number; duration: number }) {
  const pathname = usePathname() || "/";
  return typedChars(pathname, start, duration / Math.max(Array.from(pathname).length, 1));
}
