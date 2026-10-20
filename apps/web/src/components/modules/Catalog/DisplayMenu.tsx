"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  BOOK_DISPLAY_DETAILS,
  DEFAULT_BOOK_DISPLAY,
  parseBookDisplay,
  type BookDisplay,
} from "@/components/modules/Cards/BookCard/display";
import styles from "./styles.module.scss";

const STORAGE_KEY = "book-card-display";

/**
 * The reader's book card settings, remembered in this browser. Starts from
 * the defaults so the server and first browser render match, then switches
 * to the saved settings.
 */
export function useBookDisplay() {
  const [display, setDisplay] = useState<BookDisplay>(DEFAULT_BOOK_DISPLAY);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDisplay(parseBookDisplay(JSON.parse(saved)));
    } catch {
      // storage unavailable or unreadable: keep the defaults
    }
  }, []);

  const update = (next: BookDisplay) => {
    setDisplay(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // the settings still apply until the page is left
    }
  };

  return [display, update] as const;
}

const LAYOUT_OPTIONS: { value: BookDisplay["layout"]; label: string }[] = [
  { value: "poster", label: "Poster" },
  { value: "card", label: "Card" },
];

const MEDIA_OPTIONS: { value: BookDisplay["media"]; label: string }[] = [
  { value: "both", label: "Cover + Title" },
  { value: "cover", label: "Cover" },
  { value: "title", label: "Title" },
];

const SlidersIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2 4h7M13 4h1M2 12h1M7 12h7" />
    <circle cx="11" cy="4" r="1.75" />
    <circle cx="5" cy="12" r="1.75" />
  </svg>
);

/** "Cards" button opening a panel to choose which parts of each book card show */
export function DisplayMenu({ display, onChange }: { display: BookDisplay; onChange: (display: BookDisplay) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const layoutName = useId();
  const mediaName = useId();
  const detailsId = useId();

  // close on Escape (back to the button) or a click outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const allShown = BOOK_DISPLAY_DETAILS.every(({ key }) => display[key]);
  const setAll = (on: boolean) =>
    onChange({ ...display, ...Object.fromEntries(BOOK_DISPLAY_DETAILS.map(({ key }) => [key, on])) });

  return (
    <div className={styles.displayWrap} ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.displayButton}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <SlidersIcon />
        <span>Cards</span>
      </button>

      {open && (
        <div id={panelId} className={styles.displayPanel} role="dialog" aria-label="Card display">
          <fieldset className={styles.displayGroup}>
            <legend className={styles.displayHeading}>Format</legend>
            <div className={`${styles.segmented} ${styles.segmentedTwo}`}>
              {LAYOUT_OPTIONS.map(({ value, label }) => (
                <label key={value} className={styles.segment}>
                  <input
                    type="radio"
                    name={layoutName}
                    value={value}
                    checked={display.layout === value}
                    onChange={() => onChange({ ...display, layout: value })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.displayGroup}>
            <legend className={styles.displayHeading}>Show</legend>
            {/* cover and title as one choice, so they can't both be hidden */}
            <div className={styles.segmented}>
              {MEDIA_OPTIONS.map(({ value, label }) => (
                <label key={value} className={styles.segment}>
                  <input
                    type="radio"
                    name={mediaName}
                    value={value}
                    checked={display.media === value}
                    onChange={() => onChange({ ...display, media: value })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.displayGroup} role="group" aria-labelledby={detailsId}>
            <div className={styles.displayHeadingRow}>
              <span id={detailsId} className={styles.displayHeading}>
                Details
              </span>
              <button type="button" className={styles.displayAll} onClick={() => setAll(!allShown)}>
                {allShown ? "Hide all" : "Show all"}
              </button>
            </div>
            {BOOK_DISPLAY_DETAILS.map(({ key, label }) => (
              <label key={key} className={styles.check}>
                <input
                  type="checkbox"
                  checked={display[key]}
                  onChange={(e) => onChange({ ...display, [key]: e.target.checked })}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
