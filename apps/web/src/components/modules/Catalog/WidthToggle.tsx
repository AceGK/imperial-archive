"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";

export type CatalogWidth = "boxed" | "full";

const STORAGE_KEY = "catalog-width";

/**
 * How wide the catalogs' controls and results run, shared by every catalog and
 * remembered in this browser. It sets only the catalog's own width, not the
 * page's. Boxed unless the reader has chosen full width here, whatever the
 * site-wide layout; the saved choice applies after the first render so the
 * server and browser renders match.
 */
export function useCatalogWidth() {
  const [width, setWidth] = useState<CatalogWidth>("boxed");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "full") setWidth("full");
    } catch {
      // storage unavailable: stay boxed
    }
  }, []);

  const choose = (next: CatalogWidth) => {
    setWidth(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // the choice still applies until the page is left
    }
  };

  return [width, choose] as const;
}

// content held between margins, inside the screen's edges (as on the nav's layout button)
const BoxedIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M1.5 2v12M14.5 2v12" />
    <rect x="4.5" y="2" width="7" height="12" />
  </svg>
);

// content stretched out to the screen's edges
const FullIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M1.5 2v12M14.5 2v12" />
    <path d="M4 8h8M6 6 4 8l2 2M10 6l2 2-2 2" />
  </svg>
);

/** Boxed / full-width switch for a catalog's controls and results */
export function WidthToggle({ width, onChange }: { width: CatalogWidth; onChange: (width: CatalogWidth) => void }) {
  return (
    <div className={`${styles.viewToggle} ${styles.widthToggle}`} role="group" aria-label="Catalog width">
      <button
        type="button"
        className={styles.viewButton}
        aria-pressed={width === "boxed"}
        aria-label="Boxed width"
        title="Boxed width"
        onClick={() => onChange("boxed")}
      >
        <BoxedIcon />
      </button>
      <button
        type="button"
        className={styles.viewButton}
        aria-pressed={width === "full"}
        aria-label="Full width"
        title="Full width"
        onClick={() => onChange("full")}
      >
        <FullIcon />
      </button>
    </div>
  );
}
