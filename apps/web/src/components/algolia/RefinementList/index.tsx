// components/algolia/RefinementList/index.tsx
"use client";

import React from "react";
import { useRefinementList, UseRefinementListProps } from "react-instantsearch";
import { Dropdown } from "@/components/ui/Dropdown";
import styles from "./styles.module.scss";
import ChevronDown from "@/components/icons/chevron-down.svg";
import { useAwaitingFirstResults } from "@/lib/algolia/useAwaitingFirstResults";
import { FilterButtonSkeleton } from "./FilterButtonSkeleton";

export type RefinementListProps = {
  attribute: string;
  title: string;
  searchable?: boolean;
  limit?: number;
  sortBy?: UseRefinementListProps["sortBy"];
};

export function RefinementList({
  attribute,
  title,
  searchable = false,
  limit = 200,
  sortBy = ["name:asc"],
}: RefinementListProps) {
  const { items, refine } = useRefinementList({
    attribute,
    sortBy,
    limit,
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const hasActiveFilters = items.some((item) => item.isRefined);
  const awaitingFirstResults = useAwaitingFirstResults();

  if (items.length === 0) {
    // filter values come with the first results; hold the button's place until then
    return awaitingFirstResults ? <FilterButtonSkeleton title={title} /> : null;
  }

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
          <ChevronDown className={styles.chevron} />
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
            />
          </div>
        )}
        <div className={styles.items}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <label
                key={item.value}
                className={styles.checkbox}
                onClick={(e) => {
                  e.preventDefault();
                  refine(item.value);
                }}
              >
                <input
                  type="checkbox"
                  checked={item.isRefined}
                  onChange={() => {}}
                  tabIndex={-1}
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