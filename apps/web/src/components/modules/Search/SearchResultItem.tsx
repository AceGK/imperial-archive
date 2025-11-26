import styles from "./styles.module.scss";
import type { BookHit } from "./types";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const qn = normalize(query);
  if (!qn) return text;
  const lower = normalize(text);
  const parts: React.ReactNode[] = [];
  let i = 0;
  let idx = lower.indexOf(qn);
  while (idx !== -1) {
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(<mark key={idx}>{text.slice(idx, idx + qn.length)}</mark>);
    i = idx + qn.length;
    idx = lower.indexOf(qn, i);
  }
  if (i < text.length) parts.push(text.slice(i));
  return parts;
}

type Props = {
  hit: BookHit;
  query: string;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
};

export function SearchResultItem({ hit, query, isActive, onSelect, onHover }: Props) {
  const authorsLine = hit.authors?.map((a) => a.name).join(", ") || "";
  const factionsLine = hit.factions?.map((f) => f.name).join(", ") || "";

  return (
    <li
      className={`${styles.item} ${isActive ? styles.active : ""}`}
      role="option"
      aria-selected={isActive}
      onMouseEnter={onHover}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
    >
      <div className={styles.rowTitle}>
        {highlight(hit.title, query)}
        <span className={styles.kind}>{hit.format || "Book"}</span>
      </div>
      <div className={styles.rowMeta}>
        {authorsLine && <span>{highlight(authorsLine, query)}</span>}
        {factionsLine && <span className={styles.dot}>·</span>}
        {factionsLine && <span>{highlight(factionsLine, query)}</span>}
      </div>
    </li>
  );
}