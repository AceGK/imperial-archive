// components/algolia/SortBy/index.tsx
"use client";

import { useSortBy } from "react-instantsearch";
import { Dropdown } from "@/components/ui/Dropdown";
import styles from "./styles.module.scss";
import SortIcon from "@/components/icons/sort.svg";
import ChevronDown from "@/components/icons/chevron-down.svg";

export type SortOption = {
  label: string;
  value: string;
};

type SortByProps = {
  items: SortOption[];
};

export function SortBy({ items }: SortByProps) {
  const { currentRefinement, options, refine } = useSortBy({ items });

  // Find the current option label
  const currentOption = options.find((opt) => opt.value === currentRefinement);

  return (
    <div className={styles.sortBy}>
      <Dropdown.Root modalTitle="Sort By">
        <Dropdown.Trigger asChild aria-label="Sort results">
          <button className={styles.sortButton}>
            <SortIcon className={styles.sortIcon} />
            <span className={styles.labelFull}>{currentOption?.label}</span>
            <span className={styles.labelShort}>Sort</span>
            <ChevronDown className={styles.chevron} />
          </button>
        </Dropdown.Trigger>

        <Dropdown.Content className={styles.dropdown}>
          <div className={styles.items}>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => refine(option.value)}
                className={`${styles.sortOption} ${
                  option.value === currentRefinement ? styles.active : ""
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Dropdown.Content>
      </Dropdown.Root>
    </div>
  );
}