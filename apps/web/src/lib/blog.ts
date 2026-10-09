import type { PortableTextBlock } from "@portabletext/types";
import type { TocItem } from "@/components/modules/Toc";

const ROMAN: [number, string][] = [
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

function toRoman(n: number) {
  let out = "";
  for (const [value, numeral] of ROMAN) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * The post's section headings (H1 and H2 blocks, which both render as h2),
 * with unique anchor ids keyed by block `_key` for RichText's `headingIds`
 */
export function postSections(body: PortableTextBlock[] | undefined | null) {
  const items: TocItem[] = [];
  const headingIds: Record<string, string> = {};
  const used = new Set<string>();

  for (const block of body ?? []) {
    if (block._type !== "block" || (block.style !== "h1" && block.style !== "h2") || !block._key) continue;
    const label = (block.children as { text?: string }[]).map((c) => c.text ?? "").join("").trim();
    if (!label) continue;

    const base = slugify(label) || "section";
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
    used.add(id);

    headingIds[block._key] = id;
    items.push({ id, index: `§ ${toRoman(items.length + 1)}`, label });
  }

  return { items, headingIds };
}

/** "Oct 9, 2026" style date for blog posts (UTC, so server and client agree) */
export function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
