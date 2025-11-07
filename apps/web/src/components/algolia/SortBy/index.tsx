// components/algolia/SortBy/index.tsx
"use client";

import { useSortBy } from "react-instantsearch";
import styles from "./styles.module.scss";

export type SortOption = {
  label: string;
  value: string;
};

type SortByProps = {
  items: SortOption[];
  label?: string;
  showLabel?: boolean;
};

export function SortBy({ 
  items, 
  label = "Sort by:",
  showLabel = true 
}: SortByProps) {
  const { currentRefinement, options, refine } = useSortBy({ items });

  return (
    <div className={styles.sortBy}>
      {showLabel && <label htmlFor="sort-by">{label}</label>}
      <select
        id="sort-by"
        value={currentRefinement}
        onChange={(e) => refine(e.target.value)}
        className={styles.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}