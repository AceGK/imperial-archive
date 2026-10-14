import type { ReactNode } from "react";
import styles from "./styles.module.scss";

/**
 * Plain text from the studio as real paragraphs: a blank line starts a new
 * paragraph and a single line break is kept. `end` goes at the end of the last
 * paragraph, e.g. source citations.
 */
export default function Paragraphs({ text, end, className }: { text: string; end?: ReactNode; className?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={`${styles.paragraphs} ${className ?? ""}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p}
          {i === paragraphs.length - 1 && end}
        </p>
      ))}
    </div>
  );
}
