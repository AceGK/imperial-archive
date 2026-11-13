// /components/icons/factions/FactionIcon.tsx
import type { CSSProperties } from "react";
import { FACTION_ICON_IDS } from "./ids";
import styles from "./FactionIcon.module.scss";

type Props = {
  /** The faction's or group's iconId: its file in /public/icons/factions */
  id?: string | null;
  /** Size in px; leave both unset to size it with CSS */
  width?: number;
  height?: number;
  /** Accessible name; without one the icon is decorative */
  label?: string;
  className?: string;
};

/**
 * A faction icon, drawn from /public/icons/factions/<id>.svg as a CSS mask in
 * the current text color (like SiteLogo), so `color` sets it. Static files the
 * browser caches, so the icons add nothing to the JS bundle. Works in server
 * and client components. Renders nothing for an id without an icon.
 */
export default function FactionIcon({ id, width, height = width, label, className }: Props) {
  if (!id || !FACTION_ICON_IDS.has(id)) return null;

  const style = {
    "--icon": `url("/icons/factions/${id}.svg")`,
    width,
    height,
  } as CSSProperties;

  return (
    <span
      className={`${styles.icon} ${className ?? ""}`}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
