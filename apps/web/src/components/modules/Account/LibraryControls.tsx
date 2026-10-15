'use client';

import { useEffect, useRef, useState } from "react";
import { ViewToggle, type CatalogView } from "@/components/modules/Catalog/ViewToggle";
import MagnifyingGlass from "@/components/icons/magnifying-glass.svg";
import XmarkIcon from "@/components/icons/xmark.svg";
import styles from "./Library.module.scss";

export type FilterChip<K extends string> = { key: K; label: string; count: number };

/** lowercase, accents removed, so "eisenhorn" finds "Eisenhorn" */
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Every word of the query appears somewhere in `text` */
export function matchesQuery(text: string, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize(text);
  return words.every((w) => haystack.includes(w));
}

/** A set of chip keys where none selected means All */
export function useChipFilter<K extends string>() {
  const [selected, setSelected] = useState<Set<K>>(new Set());
  const toggle = (key: K) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  return { selected, toggle, clear: () => setSelected(new Set()) };
}

/**
 * The account library toolbar: search, "All" plus toggleable filter chips
 * (several can be on; a page decides how they combine), and grid/list.
 */
export function LibraryControls<K extends string>({
  query,
  onQueryChange,
  searchLabel,
  searchPlaceholder,
  total,
  chips,
  selected,
  onToggle,
  onAll,
  view,
  onViewChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  /** e.g. "Search your books by title or author" */
  searchLabel: string;
  /** e.g. "Search by title or author" */
  searchPlaceholder: string;
  total: number;
  chips: FilterChip<K>[];
  selected: Set<K>;
  onToggle: (key: K) => void;
  onAll: () => void;
  view: CatalogView;
  onViewChange: (view: CatalogView) => void;
}) {
  return (
    <div className={styles.controls}>
      <LibrarySearch value={query} onChange={onQueryChange} label={searchLabel} placeholder={searchPlaceholder} />
      <div className={styles.filters} role="group" aria-label="Show">
        <button type="button" className={styles.chip} aria-pressed={selected.size === 0} onClick={onAll}>
          All <span className={styles.chipCount}>{total}</span>
        </button>
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            className={styles.chip}
            aria-pressed={selected.has(c.key)}
            onClick={() => onToggle(c.key)}
          >
            {c.label} <span className={styles.chipCount}>{c.count}</span>
          </button>
        ))}
      </div>
      <div className={styles.view}>
        <ViewToggle view={view} onChange={onViewChange} />
      </div>
    </div>
  );
}

/** "4 books" or "2 of 4 books" */
export function LibraryCount({ shown, total, noun }: { shown: number; total: number; noun: [string, string] }) {
  const word = (n: number) => (n === 1 ? noun[0] : noun[1]);
  return (
    <p className={styles.count} aria-live="polite">
      {shown === total ? `${total} ${word(total)}` : `${shown} of ${total} ${word(total)}`}
    </p>
  );
}

/** A titled group, e.g. Reading or Authors */
export function LibrarySection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        {title} <span className={styles.sectionCount}>({count})</span>
      </h2>
      {children}
    </section>
  );
}

/** The catalog's search control: a magnifier that opens into a field. Filters as you type. */
function LibrarySearch({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}) {
  const [open, setOpen] = useState(value !== "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button type="button" className={styles.searchButton} onClick={() => setOpen(true)} aria-label={label}>
        <MagnifyingGlass aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={styles.searchField}>
      <MagnifyingGlass className={styles.searchIcon} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange("");
            setOpen(false);
          }
        }}
        // collapse back to the button when left empty
        onBlur={() => value === "" && setOpen(false)}
        placeholder={placeholder}
        aria-label={label}
      />
      {value && (
        <button
          type="button"
          className={styles.clearSearch}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <XmarkIcon aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
