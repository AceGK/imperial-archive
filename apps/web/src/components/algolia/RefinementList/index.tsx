// components/algolia/RefinementList/index.tsx
"use client";

import React from "react";
import { useRefinementList, UseRefinementListProps } from "react-instantsearch";
import { Dropdown } from "@/components/ui/Dropdown";
import styles from "./styles.module.scss";

export type RefinementListProps = {
  attribute: string;
  title: string;
  searchable?: boolean;
  limit?: number;
  showMore?: boolean;
  showMoreLimit?: number;
  sortBy?: UseRefinementListProps["sortBy"];
};

export function RefinementList({
  attribute,
  title,
  searchable = false,
  limit,
  showMore,
  showMoreLimit,
  sortBy = ["name:asc"],
}: RefinementListProps) {
  const { items, refine } = useRefinementList({
    attribute,
    sortBy,
    limit,
    showMore,
    showMoreLimit,
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const hasActiveFilters = items.some((item) => item.isRefined);

  if (items.length === 0) return null;

  // Filter items based on search query
  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild aria-label={`Filter by ${title}`}>
        <button className={styles.filterButton}>
          {title}
          {hasActiveFilters && <span className={styles.badge} />}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Content className={styles.dropdown}>
        {searchable && (
          <div className={styles.searchHeader}>
            <input
              type="search"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className={styles.items}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <label key={item.value} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={item.isRefined}
                  onChange={() => refine(item.value)}
                />
                <span className={styles.label}>
                  {item.label}{" "}
                  <span className={styles.count}>({item.count})</span>
                </span>
              </label>
            ))
          ) : (
            <div className={styles.noResults}>No results found</div>
          )}
        </div>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}