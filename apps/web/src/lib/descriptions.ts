// Meta descriptions built from the catalog's own data (counts, formats,
// authors, series order), so each page's search snippet says what's on the
// page in our words rather than repeating lore text copied from elsewhere.
// Every builder returns plain text; pageMetadata's caller trims it to length.

const FORMAT_PLURALS: Record<string, [string, string]> = {
  Novel: ["novel", "novels"],
  Novella: ["novella", "novellas"],
  "Short Story": ["short story", "short stories"],
  "Audio Drama": ["audio drama", "audio dramas"],
  Anthology: ["anthology", "anthologies"],
  Omnibus: ["omnibus", "omnibuses"],
  "Graphic Novel": ["graphic novel", "graphic novels"],
  "Audio Anthology": ["audio anthology", "audio anthologies"],
};

/** "A", "A and B", "A, B and C" */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Up to `max` names, then "and others": "Dan Abnett, Graham McNeill and others" */
function nameList(names: string[], max = 2): string {
  if (names.length <= max) return joinList(names);
  return `${names.slice(0, max).join(", ")} and others`;
}

/** The most common formats with counts: "14 novels, 6 short stories and 5 audio dramas" */
export function formatSummary(formats: (string | null | undefined)[], max = 3): string {
  const counts = new Map<string, number>();
  for (const f of formats) {
    if (f && FORMAT_PLURALS[f]) counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max);
  return joinList(top.map(([f, n]) => `${n} ${FORMAT_PLURALS[f][n === 1 ? 0 : 1]}`));
}

/**
 * "all 6 books" or, when every work shares one format, "all 3 novellas";
 * `formats` is then left out, as it would only repeat the count
 */
function countPhrase(
  n: number,
  formats: (string | null | undefined)[],
  all: boolean
): { phrase: string; single: boolean } {
  const kinds = new Set(formats.filter(Boolean));
  const only = kinds.size === 1 && formats.every(Boolean) ? [...kinds][0]! : null;
  const plural = only && FORMAT_PLURALS[only];
  const noun = plural ? plural[n === 1 ? 0 : 1] : n === 1 ? "book" : "books";
  return { phrase: `${all && n > 1 ? "all " : ""}${n} ${noun}`, single: Boolean(plural) };
}

/** Most frequent values first, without repeats */
function byFrequency(values: (string | null | undefined)[]): string[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
}

const MAX = 160;

/**
 * The first candidate that fits a search snippet whole, so a sentence isn't
 * cut off mid-title; candidates run from fullest to barest
 */
function firstThatFits(candidates: string[]): string {
  return candidates.find((c) => c.length <= MAX) ?? candidates[candidates.length - 1];
}

/** "The Vaults of Terra reading order", without doubling a leading "The" */
export function readingOrderName(title: string): string {
  return /^the\s/i.test(title) ? `${title} reading order` : `The ${title} reading order`;
}

/** Adds the page's own intro text after the generated sentence while there's room for some of it */
function withIntro(base: string, intro?: string | null, room = MAX): string {
  const text = intro?.replace(/\s+/g, " ").trim();
  if (!text || base.length > room - 40) return base;
  return `${base} ${text}`;
}

type Work = {
  _id?: string;
  title?: string;
  format?: string | null;
  authors?: { name?: string | null }[] | null;
};

/** "The Vaults of Terra reading order: all 6 books (3 novels, 2 short stories and 1 audio drama) by Chris Wraight, starting with Argent." */
export function seriesDescription(
  title: string,
  lists: { items?: { work?: Work | null }[] | null }[] | null | undefined,
  intro?: string | null
): string | null {
  const seen = new Map<string, Work>();
  for (const list of lists ?? []) {
    for (const item of list.items ?? []) {
      const w = item.work;
      if (w?._id && !seen.has(w._id)) seen.set(w._id, w);
    }
  }
  const works = [...seen.values()];
  if (works.length === 0) return null;

  const n = works.length;
  const count = countPhrase(n, works.map((w) => w.format), true);
  const formats = n > 1 && !count.single ? formatSummary(works.map((w) => w.format)) : "";
  const authors = byFrequency(works.flatMap((w) => (w.authors ?? []).map((a) => a?.name)));
  const first = n > 1 ? works[0]?.title : undefined;

  const build = (withFormats: boolean, withAuthors: boolean, withFirst: boolean) =>
    `${readingOrderName(title)}: ${count.phrase}` +
    (withFormats && formats ? ` (${formats})` : "") +
    (withAuthors && authors.length ? ` by ${nameList(authors)}` : "") +
    (withFirst && first ? `, starting with ${first}` : "") +
    ".";
  const base = firstThatFits([
    build(true, true, true),
    build(false, true, true),
    build(false, false, true),
    build(false, false, false),
  ]);
  return withIntro(base, intro);
}

/** "Every Dan Abnett Warhammer 40k book in one list: 25 books (14 novels, …), including Gaunt's Ghosts and Eisenhorn." */
export function authorDescription(
  name: string,
  books: { format?: string | null; series?: string | null }[],
  bio?: string | null
): string | null {
  if (books.length === 0) return null;
  const n = books.length;
  const count = countPhrase(n, books.map((b) => b.format), false);
  const formats = n > 1 && !count.single ? formatSummary(books.map((b) => b.format)) : "";
  const series = byFrequency(books.map((b) => b.series)).slice(0, 2);

  const build = (withFormats: boolean, seriesCount: number) =>
    `Every ${name} Warhammer 40k book in one list: ${count.phrase}` +
    (withFormats && formats ? ` (${formats})` : "") +
    (seriesCount && series.length ? `, including ${joinList(series.slice(0, seriesCount))}` : "") +
    ".";
  const base = firstThatFits([build(true, 2), build(true, 1), build(false, 1), build(false, 0)]);
  return withIntro(base, bio);
}

/** "The Carrion Throne by Chris Wraight, #2 in the Vaults of Terra reading order: a Warhammer 40,000 novel from Black Library (2017). <blurb>" */
export function bookDescription({
  title,
  authors,
  format,
  year,
  series,
  blurb,
}: {
  title: string;
  authors: string[];
  format?: string | null;
  year?: string | null;
  series?: { name: string; position?: number | null } | null;
  blurb?: string | null;
}): string {
  const kind = format && FORMAT_PLURALS[format] ? FORMAT_PLURALS[format][0] : "book";
  const seriesPart = series
    ? series.position
      ? `, #${series.position} in the ${series.name.replace(/^the\s/i, "")} reading order`
      : `, part of the ${series.name.replace(/^the\s/i, "")} series`
    : "";
  const build = (withSeries: boolean) =>
    `${title}${authors.length ? ` by ${nameList(authors)}` : ""}` +
    (withSeries ? seriesPart : "") +
    `: a Warhammer 40,000 ${kind} from Black Library${year ? ` (${year})` : ""}.`;
  const base = firstThatFits([build(true), build(false)]);
  return withIntro(base, blurb);
}
