// /components/icons/factions/resolve.ts
import { iconRegistry, type IconId } from "./index";

export function resolveIcon(id?: string) {
  if (!id) return null;
  return iconRegistry[id as IconId] ?? null;
}

// (Optional) Backcompat alias if you still call resolveGroupIcon somewhere
export const resolveGroupIcon = resolveIcon;
