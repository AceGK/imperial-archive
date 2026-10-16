/**
 * Which parts of a book card a reader has chosen to show (catalog "Cards"
 * menu). Cover and title are one setting with three choices, so at least one
 * of them is always shown.
 */
export type BookDisplay = {
  media: "both" | "cover" | "title";
  author: boolean;
  date: boolean;
  format: boolean;
  series: boolean;
  tags: boolean;
};

/** The optional details, in menu order */
export const BOOK_DISPLAY_DETAILS = [
  { key: "author", label: "Author" },
  { key: "date", label: "Publication date" },
  { key: "format", label: "Format" },
  { key: "series", label: "Series" },
  { key: "tags", label: "Tracking tags" },
] as const satisfies readonly { key: keyof BookDisplay; label: string }[];

export const DEFAULT_BOOK_DISPLAY: BookDisplay = {
  media: "both",
  author: true,
  date: true,
  format: true,
  series: true,
  tags: true,
};

/** A saved value back as settings, ignoring anything missing or malformed */
export function parseBookDisplay(value: unknown): BookDisplay {
  const saved = (value && typeof value === "object" ? value : {}) as Partial<Record<keyof BookDisplay, unknown>>;
  const display = { ...DEFAULT_BOOK_DISPLAY };
  if (saved.media === "both" || saved.media === "cover" || saved.media === "title") display.media = saved.media;
  for (const { key } of BOOK_DISPLAY_DETAILS) {
    if (typeof saved[key] === "boolean") display[key] = saved[key];
  }
  return display;
}
