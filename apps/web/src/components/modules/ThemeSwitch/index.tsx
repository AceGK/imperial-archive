"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import SunIcon from "@/components/icons/sun.svg";
import MoonIcon from "@/components/icons/moon.svg";
import styles from "./styles.module.scss";

/**
 * Sliding light/dark switch. The knob position is driven by `data-theme` in
 * CSS so it's correct on first paint; `aria-checked` waits for mount because
 * the theme isn't known during the server render.
 */
export default function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={mounted ? isDark : undefined}
      aria-label="Dark mode"
      title="Switch theme"
      className={styles.switch}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <SunIcon className={`${styles.icon} ${styles.sun}`} aria-hidden="true" />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
      <MoonIcon className={`${styles.icon} ${styles.moon}`} aria-hidden="true" />
    </button>
  );
}
