// /src/lib/40k-factions.ts
import fs from "fs";
import path from "path";

const FACTIONS_DIR = path.join(process.cwd(), "data");
const FILE = path.join(FACTIONS_DIR, "40k-factions.json");

/** Item (faction) used throughout the app */
export interface Faction {
  title: string;
  slug: string;
  image?: string;          // ← make optional (many of your items don't have images now)
  iconId: string;
  group: string;           // group key (e.g., "imperium")
  description?: string;
  lexicanumLink?: string | null; // ← add
}

/** Group metadata exactly as in your JSON */
export interface GroupMeta {
  title: string;           // "Imperium of Man", "Space Marines", etc.
  iconId: string;          // maps to your SVG registry key
  slug: string;            // human slug for the group
  description: string;
  lexicanumLink?: string | null; // ← add (useful if you show a group-level link)
}

/** Grouped return shape for pages/components */
export interface GroupedFactions {
  key: string;             // object key in JSON, e.g. "imperium"
  meta: GroupMeta;
  items: Faction[];
}

/** JSON input shape (new layout only) */
interface FactionItemInput {
  title: string;
  slug: string;
  image?: string;
  iconId: string;
  description?: string;
  // JSON may provide either of these:
  ["lexicanum-link"]?: string;
  lexicanumLink?: string;
}
interface GroupMetaInput {
  title: string;
  iconId: string;
  slug: string;
  description: string;
  ["lexicanum-link"]?: string;
  lexicanumLink?: string;
}
interface GroupBucketInput {
  meta: GroupMetaInput;
  items: FactionItemInput[];
}
type FactionsRaw = Record<string, GroupBucketInput>;

const slugify = (str: string): string =>
  String(str)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Load raw JSON (new layout only) */
function loadRaw(): FactionsRaw {
  const text = fs.readFileSync(FILE, "utf8");
  return JSON.parse(text) as FactionsRaw;
}

/** Normalize to grouped + flat once, then reuse (tiny in-memory cache) */
let _groupedCache: GroupedFactions[] | null = null;
let _flatCache: Faction[] | null = null;

function buildCaches() {
  const raw = loadRaw();
  const grouped: GroupedFactions[] = [];
  const flat: Faction[] = [];

  for (const [key, bucket] of Object.entries(raw)) {
    const metaLex =
      (bucket.meta as any)?.["lexicanum-link"] ??
      (bucket.meta as any)?.lexicanumLink ??
      null;

    const normalizedMeta: GroupMeta = {
      title: bucket.meta.title,
      iconId: bucket.meta.iconId,
      slug: bucket.meta.slug,
      description: bucket.meta.description,
      lexicanumLink: metaLex,
    };

    const normalizedItems: Faction[] = bucket.items.map((i) => {
      const iLex =
        (i as any)?.["lexicanum-link"] ??
        (i as any)?.lexicanumLink ??
        null;

      return {
        title: i.title,
        slug: i.slug || slugify(i.title),
        image: i.image, // optional
        iconId: i.iconId,
        description: i.description,
        group: key,
        lexicanumLink: iLex,
      };
    });

    grouped.push({ key, meta: normalizedMeta, items: normalizedItems });
    flat.push(...normalizedItems);
  }

  _groupedCache = grouped;
  _flatCache = flat;
}

function ensureCaches() {
  if (!_groupedCache || !_flatCache) buildCaches();
}

/** (Optional) expose a way to clear/rebuild caches in dev */
export function reloadFactions() {
  _groupedCache = null;
  _flatCache = null;
  ensureCaches();
}

/** Public API */
export function getGroupedFactions(): GroupedFactions[] {
  ensureCaches();
  return _groupedCache!;
}

export function getFactions(): Faction[] {
  ensureCaches();
  return _flatCache!;
}

export function getFactionSlugs(): string[] {
  return getFactions().map((f) => f.slug);
}

export function getFactionBySlug(slug: string): Faction | null {
  return getFactions().find((f) => f.slug === slug) ?? null;
}

export function getGroupMeta(groupKey: string): GroupMeta | null {
  const group = getGroupedFactions().find((g) => g.key === groupKey);
  return group?.meta ?? null;
}

export function searchFactions(q: string = ""): Faction[] {
  const all = getFactions();
  const needle = q.trim().toLowerCase();
  if (!needle) return all;
  return all.filter(
    (f) =>
      f.title.toLowerCase().includes(needle) ||
      f.group.toLowerCase().includes(needle) ||
      (f.description && f.description.toLowerCase().includes(needle))
  );
}
