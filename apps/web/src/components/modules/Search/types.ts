export type BookHit = {
  objectID: string;
  title: string;
  slug: string;
  format: string | null;
  authors: Array<{ name: string; slug: string }>;
  factions: Array<{ name: string; slug: string }>;
  era: { name: string; slug: string } | null;
  series: { title: string; slug: string } | null;
};