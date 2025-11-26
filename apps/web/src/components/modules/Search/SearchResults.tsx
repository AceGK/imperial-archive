import { forwardRef } from "react";
import { SearchResultItem } from "./SearchResultItem";
import styles from "./styles.module.scss";
import type { BookHit } from "./types";

type Props = {
  hits: BookHit[];
  query: string;
  activeIndex: number;
  onSelectHit: (hit: BookHit) => void;
  onSelectSeeAll: () => void;
  onHover: (index: number) => void;
};

export const SearchResults = forwardRef<HTMLUListElement, Props>(
  ({ hits, query, activeIndex, onSelectHit, onSelectSeeAll, onHover }, ref) => {
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

        {hits.map((hit, i) => (
          <SearchResultItem
            key={hit.objectID}
            hit={hit}
            query={query}
            isActive={i + 1 === activeIndex}
            onSelect={() => onSelectHit(hit)}
            onHover={() => onHover(i + 1)}
          />
        ))}
      </ul>
    );
  }
);

SearchResults.displayName = "SearchResults";