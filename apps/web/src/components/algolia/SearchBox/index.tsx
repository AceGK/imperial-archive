// components/algolia/SearchBox/index.tsx
"use client";

import React from "react";
import { useSearchBox } from "react-instantsearch";
import MagnifyingGlass from "@/components/icons/magnifying-glass.svg";
import styles from "./styles.module.scss";

type SearchBoxProps = {
  placeholder?: string;
  debounceMs?: number;
};

export function SearchBox({ 
  placeholder = "Search...", 
  debounceMs = 300 
}: SearchBoxProps) {
  const { query, refine } = useSearchBox();
  const [value, setValue] = React.useState(query);
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setValue(query);
  }, [query]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      refine(value);
    }, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [value, refine, debounceMs]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inputRef.current && !inputRef.current.parentElement?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setValue("");
      refine("");
    }
  };

  return (
    <div className={styles.searchBox}>
      {!isOpen ? (
        <button
          className={styles.searchButton}
          onClick={() => setIsOpen(true)}
          aria-label="Open search"
          type="button"
        >
          <MagnifyingGlass />
        </button>
      ) : (
        <div className={styles.searchInputWrapper}>
          <MagnifyingGlass className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={styles.searchInput}
          />
          {value && (
            <button
              className={styles.clearButton}
              onClick={() => {
                setValue("");
                refine("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}