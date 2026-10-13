"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";

export type CatalogView = "grid" | "list";

const STORAGE_KEY = "catalog-view";

/**
 * The reader's grid/list choice, shared by every catalog and remembered in
 * this browser. Starts as grid so the server and first browser render match,
 * then switches to the saved choice.
 */
export function useCatalogView() {
  const [view, setView] = useState<CatalogView>("grid");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "list") setView("list");
    } catch {
      // storage unavailable (private mode, blocked): stay on grid
    }
  }, []);

  const choose = (next: CatalogView) => {
    setView(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // the choice still applies until the page is left
    }
  };

  return [view, choose] as const;
}

const GridIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="1.5" y="1.5" width="5" height="5" />
    <rect x="9.5" y="1.5" width="5" height="5" />
    <rect x="1.5" y="9.5" width="5" height="5" />
    <rect x="9.5" y="9.5" width="5" height="5" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="1.5" y="2" width="3" height="3" />
    <path d="M7 3.5h7.5" />
    <rect x="1.5" y="6.5" width="3" height="3" />
    <path d="M7 8h7.5" />
    <rect x="1.5" y="11" width="3" height="3" />
    <path d="M7 12.5h7.5" />
  </svg>
);

/** Grid / list switch for a catalog's results */
export function ViewToggle({ view, onChange }: { view: CatalogView; onChange: (view: CatalogView) => void }) {
  return (
    <div className={styles.viewToggle} role="group" aria-label="Layout">
      <button
        type="button"
        className={styles.viewButton}
        aria-pressed={view === "grid"}
        aria-label="Grid view"
        title="Grid view"
        onClick={() => onChange("grid")}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        className={styles.viewButton}
        aria-pressed={view === "list"}
        aria-label="List view"
        title="List view"
        onClick={() => onChange("list")}
      >
        <ListIcon />
      </button>
    </div>
  );
}
