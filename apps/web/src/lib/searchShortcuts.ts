// Everything the hero search matches in the browser rather than through Algolia:
// authors, series, faction groups, factions and eras, loaded from Sanity with
// the homepage and turned into search rows.
import "server-only";
import { client } from "@/lib/sanity/sanity.client";
import { searchShortcuts40kQuery } from "@/lib/sanity/queries";
import type { SearchShortcut } from "@/components/modules/Search";

type Doc = { id: string; title: string; slug: string };
type CountedDoc = Doc & { count: number };
type FactionDoc = Doc & { group: { title: string; slug: string } };

type ShortcutDocs = {
  authors: CountedDoc[];
  series: CountedDoc[];
  groups: Doc[];
  factions: FactionDoc[];
  eras: Doc[];
};

const works = (n: number) => `${n} ${n === 1 ? "work" : "works"}`;

const authorShortcut = (a: CountedDoc): SearchShortcut => ({
  id: a.id,
  kind: "author",
  title: a.title,
  href: `/authors/${a.slug}`,
  context: works(a.count),
  count: a.count,
});

const seriesShortcut = (s: CountedDoc): SearchShortcut => ({
  id: s.id,
  kind: "series",
  title: s.title,
  href: `/series/${s.slug}`,
  context: works(s.count),
  count: s.count,
});

const factionGroupShortcut = (g: Doc): SearchShortcut => ({
  id: g.id,
  kind: "factionGroup",
  title: g.title,
  href: `/factions/${g.slug}`,
  context: "Faction group",
});

const factionShortcut = (f: FactionDoc): SearchShortcut => ({
  id: f.id,
  kind: "faction",
  title: f.title,
  href: `/factions/${f.group.slug}/${f.slug}`,
  context: f.group.title,
});

const eraShortcut = (e: Doc): SearchShortcut => ({
  id: e.id,
  kind: "era",
  title: e.title,
  href: `/eras/${e.slug}`,
});

export async function getSearchShortcuts(): Promise<SearchShortcut[]> {
  const docs = await client.fetch<ShortcutDocs>(searchShortcuts40kQuery, {}, { next: { revalidate: 60 } });

  return [
    ...docs.authors.map(authorShortcut),
    ...docs.series.map(seriesShortcut),
    ...docs.groups.map(factionGroupShortcut),
    ...docs.factions.map(factionShortcut),
    ...docs.eras.map(eraShortcut),
  ];
}
