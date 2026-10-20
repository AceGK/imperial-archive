import styles from "./styles.module.scss";
import { EXTERNAL_REL } from "@/lib/links";

/** A link from the studio's "Links" field on a book or series */
export type SourceLink = {
  _key?: string;
  type?: string | null;
  url?: string | null;
  /** Which texts came from this link; see bookLink.sourceFor in the studio */
  sourceFor?: string[] | null;
};

export type Source = { number: number; label: string; url: string; host: string };

const LABELS: Record<string, string> = {
  black_library: "Black Library",
  lexicanum: "Lexicanum",
  goodreads: "Goodreads",
  amazon: "Amazon",
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * Numbers a page's links as its sources, and works out which numbers to cite
 * after each text. Links marked "Source for" a text are cited for it; when no
 * link on the page is marked, every link is cited for every text.
 */
export function buildSources<Field extends string>(links: SourceLink[] | null | undefined, fields: Field[]) {
  const valid = (links ?? []).filter((l): l is SourceLink & { url: string } => !!l?.url);
  const sources: Source[] = valid.map((l, i) => {
    const host = hostOf(l.url);
    return { number: i + 1, label: (l.type && LABELS[l.type]) || host, url: l.url, host };
  });

  const anyMarked = valid.some((l) => l.sourceFor?.length);
  const citations = Object.fromEntries(
    fields.map((field) => [
      field,
      valid.flatMap((l, i) => (!anyMarked || l.sourceFor?.includes(field) ? [i + 1] : [])),
    ]),
  ) as Record<Field, number[]>;

  return { sources, citations };
}

/** Bracketed source numbers after a text, e.g. [1][2], each linking to its entry below */
export function Cite({ numbers }: { numbers: number[] }) {
  if (numbers.length === 0) return null;
  return (
    <sup className={styles.cite}>
      {numbers.map((n) => (
        <a key={n} href={`#source-${n}`} aria-label={`Source ${n}`}>
          [{n}]
        </a>
      ))}
    </sup>
  );
}

/** The numbered "Sources" list at the bottom of a page, as on Lexicanum */
export function SourceList({ sources, title }: { sources: Source[]; title: string }) {
  if (sources.length === 0) return null;
  return (
    <section className={styles.sources} aria-labelledby="sources-heading">
      <h2 id="sources-heading" className={styles.heading}>
        Sources
      </h2>
      <ol className={styles.list}>
        {sources.map((s) => (
          <li key={s.number} id={`source-${s.number}`} className={styles.item}>
            <span className={styles.number}>[{s.number}]</span>{" "}
            <span>
              {s.label}: <em>{title}</em>{" "}
              <a href={s.url} target="_blank" rel={EXTERNAL_REL} className={styles.link}>
                {s.host}
                <span className={styles.visuallyHidden}> (opens in a new tab)</span>
              </a>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
