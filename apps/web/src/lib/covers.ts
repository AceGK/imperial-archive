// Alt text for book covers, shared by cards, rows, book pages and share images

type AuthorLike = { name?: string | null } | string | null | undefined;

/**
 * The cover's own alt text from the studio when set, otherwise
 * "Cover of The Carrion Throne by Chris Wraight". Naming the author helps
 * screen reader users tell editions apart and gives image search the context.
 */
export function coverAlt(
  title: string | null | undefined,
  authors?: AuthorLike[] | null,
  studioAlt?: string | null
): string {
  const own = studioAlt?.trim();
  if (!title) return own || "Book cover";
  // keep written alt text, but not the generic "<title> cover" many covers
  // were imported with, which says less than the generated version
  if (own && own.toLowerCase() !== `${title} cover`.toLowerCase()) return own;
  const names = (authors ?? [])
    .map((a) => (typeof a === "string" ? a : a?.name))
    .filter((n): n is string => Boolean(n));
  const by =
    names.length === 0 ? "" : names.length <= 2 ? ` by ${names.join(" and ")}` : ` by ${names[0]} and others`;
  return `Cover of ${title}${by}`;
}
