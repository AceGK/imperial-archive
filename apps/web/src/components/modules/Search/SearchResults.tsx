import { forwardRef } from "react";
import { SearchResultItem } from "./SearchResultItem";
import styles from "./styles.module.scss";
import type { ResultRow } from "./types";

type Props = {
  rows: ResultRow[];
  query: string;
  /** 0 is "View all results"; rows count on from 1 */
  activeIndex: number;
  onSelectRow: (row: ResultRow) => void;
  onSelectSeeAll: () => void;
  onHover: (index: number) => void;
};

export const SearchResults = forwardRef<HTMLUListElement, Props>(
  ({ rows, query, activeIndex, onSelectRow, onSelectSeeAll, onHover }, ref) => {
    return (
      <ul
        className={styles.list}
        ref={ref}
        role="listbox"
        aria-label="Search suggestions"
      >
        <li
          className={`${styles.item} ${styles.seeAllItem} ${activeIndex === 0 ? styles.active : ""}`}
          role="option"
          aria-selected={activeIndex === 0}
          onMouseEnter={() => onHover(0)}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelectSeeAll();
          }}
        >
          <div className={styles.rowTitle}>
            <span className={styles.seeAllIcon}>→</span>
            <span>View all results for </span>
            <mark className={styles.queryHighlight}>{query}</mark>
          </div>
        </li>

        {rows.map((row, i) => (
          <SearchResultItem
            key={row.key}
            row={row}
            query={query}
            isActive={i + 1 === activeIndex}
            onSelect={() => onSelectRow(row)}
            onHover={() => onHover(i + 1)}
          />
        ))}
      </ul>
    );
  }
);

SearchResults.displayName = "SearchResults";
