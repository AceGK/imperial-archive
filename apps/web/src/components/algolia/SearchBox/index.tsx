// components/algolia/SearchBox/index.tsx
"use client";

import React from "react";
import { useSearchBox } from "react-instantsearch";
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

  React.useEffect(() => {
    setValue(query);
  }, [query]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      refine(value);
    }, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [value, refine, debounceMs]);

  return (
    <div className={styles.searchBox}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
      />
    </div>
  );
}