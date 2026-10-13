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

// "Dan Abnett, David Annandale +6 more": names matching the query go first so
// the highlighted match is never the part that gets cut
function summarize(names: string[], query: string, max = 2): string {
  const qn = normalize(query);
  const ordered = qn
    ? [...names.filter((n) => normalize(n).includes(qn)), ...names.filter((n) => !normalize(n).includes(qn))]
    : names;
  const shown = ordered.slice(0, max).join(", ");
  const rest = ordered.length - max;
  return rest > 0 ? `${shown} +${rest} more` : shown;
}

type Props = {
  hit: BookHit;
  query: string;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
};

export function SearchResultItem({ hit, query, isActive, onSelect, onHover }: Props) {
  const authorsLine = summarize(hit.authors?.map((a) => a.name) ?? [], query);
  const factionsLine = summarize(hit.factions?.map((f) => f.name) ?? [], query);

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
        <span>{highlight(hit.title, query)}</span>
        <span className={styles.kind}>{hit.format || "Book"}</span>
      </div>
      <div className={styles.rowMeta}>
        {authorsLine && highlight(authorsLine, query)}
        {authorsLine && factionsLine && <span className={styles.dot}> · </span>}
        {factionsLine && highlight(factionsLine, query)}
      </div>
    </li>
  );
}