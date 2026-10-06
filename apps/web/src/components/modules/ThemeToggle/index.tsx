"use client";

import { useTheme } from "next-themes";
import Button from "@/components/ui/Button";
import SunIcon from "@/components/icons/sun.svg";
import MoonIcon from "@/components/icons/moon.svg";
import styles from "./styles.module.scss";

/**
 * Icon button that flips between light and dark mode.
 * Shows the sun in dark mode (click for light) and the moon in light mode.
 * Which icon is visible is decided in CSS from `data-theme`, so the server
 * render matches the client and nothing flashes on load.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Switch theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span className={styles.icon} aria-hidden="true">
        <SunIcon className={styles.sun} />
        <MoonIcon className={styles.moon} />
      </span>
    </Button>
  );
}
