// Turns book hits and local matches into the dropdown's single list of rows
import type { BookHit, ResultRow, SearchShortcut } from "./types";

/** Lowercase without accents, so "Ahriman" matches "ahríman" */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
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

/** Matching the start of the title, then the start of any word, then anywhere */
function rank(title: string, q: string): number {
  const t = normalize(title);
  if (t.startsWith(q)) return 0;
  if (t.includes(` ${q}`)) return 1;
  return t.includes(q) ? 2 : -1;
}

/** Local matches wait for this many letters; one letter matches half the list */
const MIN_QUERY = 2;

function matchShortcuts(
  shortcuts: SearchShortcut[],
  kinds: SearchShortcut["kind"][],
  query: string,
  max: number
): SearchShortcut[] {
  const q = normalize(query.trim());
  if (q.length < MIN_QUERY) return [];
  return shortcuts
    // empty authors and series lead to "no books yet" pages
    .filter((s) => kinds.includes(s.kind) && s.count !== 0)
    .map((s) => ({ s, r: rank(s.title, q) }))
    .filter((m) => m.r >= 0)
    // equally good matches: most publications first, so "horus" leads with the
    // 54-book Horus Heresy rather than one of its smaller sub-series
    .sort((a, b) => a.r - b.r || (b.s.count ?? 0) - (a.s.count ?? 0))
    .slice(0, max)
    .map((m) => m.s);
}

const BADGES: Record<SearchShortcut["kind"], string> = {
  author: "Author",
  series: "Series",
  factionGroup: "Faction",
  faction: "Faction",
  era: "Era",
};

const shortcutRow = (s: SearchShortcut): ResultRow => ({
  key: `${s.kind}:${s.id}`,
  href: s.href,
  title: s.title,
  meta: s.context,
  badge: BADGES[s.kind],
});

/** Author, series, faction and era matches, authors first; no Algolia request */
export function buildLocalRows(query: string, shortcuts: SearchShortcut[]): ResultRow[] {
  return [
    ...matchShortcuts(shortcuts, ["author"], query, 3),
    ...matchShortcuts(shortcuts, ["series"], query, 3),
    ...matchShortcuts(shortcuts, ["factionGroup", "faction"], query, 3),
    ...matchShortcuts(shortcuts, ["era"], query, 2),
  ].map(shortcutRow);
}

/**
 * One list, authors first: people searching a name usually want the author,
 * and the few author/series/faction/era matches would otherwise sit below a
 * page of books. Only books come from Algolia; the rest are matched here.
 */
export function buildRows(query: string, books: BookHit[], shortcuts: SearchShortcut[]): ResultRow[] {
  const local = buildLocalRows(query, shortcuts);

  const bookRows = books.map((hit): ResultRow => {
    const authorsLine = summarize(hit.authors?.map((a) => a.name) ?? [], query);
    const factionsLine = summarize(hit.factions?.map((f) => f.name) ?? [], query);
    return {
      key: `book:${hit.objectID}`,
      href: `/books/${hit.slug}`,
      title: hit.title,
      badge: hit.format || "Book",
      meta: [authorsLine, factionsLine].filter(Boolean).join(" · ") || undefined,
    };
  });

  return [...local, ...bookRows];
}
