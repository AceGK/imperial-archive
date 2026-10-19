import styles from "./styles.module.scss";
import { normalize } from "./rows";
import type { ResultRow } from "./types";

export function highlight(text: string, query: string): React.ReactNode {
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
  row: ResultRow;
  query: string;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
};

export function SearchResultItem({ row, query, isActive, onSelect, onHover }: Props) {
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
        {/* one element, so the highlight pieces aren't separate flex items, which drop their edge spaces */}
        <span>{highlight(row.title, query)}</span>
        {row.badge && <span className={styles.kind}>{row.badge}</span>}
      </div>
      {row.meta && <div className={styles.rowMeta}>{highlight(row.meta, query)}</div>}
    </li>
  );
}
