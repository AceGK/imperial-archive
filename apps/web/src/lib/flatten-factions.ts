// /lib/normalize-factions.ts
export type RawFactionGroup = {
  meta?: { title?: string; slug?: string };
  items: { title: string; slug: string; iconId?: string }[];
};

export type Faction = {
  title: string;
  slug: string;
  iconId?: string;
  group?: string;      // e.g. "Space Marines"
  groupSlug?: string;  // e.g. "space-marines"
};

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function flattenFactions(
  raw: Record<string, RawFactionGroup> | RawFactionGroup[]
): Faction[] {
  const groups = Array.isArray(raw) ? raw : Object.values(raw);
  const out: Faction[] = [];

  for (const g of groups) {
    const groupTitle = g.meta?.title ?? "";
    const groupSlug = g.meta?.slug ?? slugify(groupTitle);

    for (const item of g.items ?? []) {
      out.push({
        title: item.title,
        slug: item.slug,
        iconId: item.iconId,
        group: groupTitle,
        groupSlug, // <= critical for routing
      });
    }
  }
  return out;
}
