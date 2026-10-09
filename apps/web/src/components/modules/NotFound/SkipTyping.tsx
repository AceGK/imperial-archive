"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./styles.module.scss";

/** Shows all of the typed text at once when the reader clicks or presses a key */
export default function SkipTyping({ className, children }: { className?: string; children: ReactNode }) {
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) return;
    const skip = () => setSkipped(true);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [skipped]);

  return <div className={`${className ?? ""} ${skipped ? styles.skipped : ""}`}>{children}</div>;
}
