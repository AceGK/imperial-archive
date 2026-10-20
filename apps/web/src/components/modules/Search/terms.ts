// Search terms shared by the hero and nav searches: the popular picks, and the
// reader's recent searches (one history for both boxes)

export const SUGGESTED_SEARCHES = [
  "Dan Abnett",
  "The Horus Heresy",
  "Graham McNeill",
  "Aaron Dembski-Bowden",
  "Gaunt's Ghosts",
];

const RECENT_KEY = "recentSearches";
const MAX_RECENT = 5;

// storage can be missing or blocked (private windows), so every access is guarded
export function readRecentSearches(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** Puts a term first in the history and returns the new list */
export function saveRecentSearch(term: string): string[] {
  const trimmed = term.trim();
  const current = readRecentSearches();
  if (!trimmed) return current;
  const updated = [trimmed, ...current.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {}
}
