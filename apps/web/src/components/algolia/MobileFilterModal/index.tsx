// components/algolia/MobileFilterModal/index.tsx
"use client";

import React from "react";
import { useClearRefinements } from "react-instantsearch";
import styles from "./styles.module.scss";
import FilterIcon from "@/components/icons/filter.svg";

export type FilterSection = {
  label: string;
  searchable?: boolean;
  items: Array<{
    value: string;
    label: string;
    count: number;
    isRefined: boolean;
  }>;
  refine: (value: string) => void;
};

type MobileFilterModalProps = {
  sections: FilterSection[];
  hasActiveFilters: boolean;
  buttonLabel?: string;
};

export function MobileFilterModal({
  sections,
  hasActiveFilters,
  buttonLabel = "Filters",
}: MobileFilterModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searches, setSearches] = React.useState<Record<string, string>>({});
  const { canRefine, refine: clearRefinements } = useClearRefinements();

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const updateSearch = (label: string, value: string) => {
    setSearches((prev) => ({ ...prev, [label]: value }));
  };

  const getFilteredItems = (section: FilterSection) => {
    const searchQuery = searches[section.label] || "";
    if (!searchQuery) return section.items;

    return section.items.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.triggerButton}
        onClick={() => setIsOpen(true)}
        aria-label={buttonLabel}
      >
        <FilterIcon />
        {buttonLabel}
        {hasActiveFilters && <span className={styles.badge} />}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />

          {/* Full-screen modal */}
          <div className={styles.modal}>
            <div className={styles.header}>
              <span>{buttonLabel}</span>
              <button
                onClick={() => setIsOpen(false)}
                className={styles.closeButton}
                aria-label={`Close ${buttonLabel.toLowerCase()}`}
              >
                ✕
              </button>
            </div>

            <div className={styles.content}>
              {sections.map((section) => {
                if (section.items.length === 0) return null;

                const filteredItems = getFilteredItems(section);

                return (
                  <div key={section.label} className={styles.section}>
                    <div className={styles.sectionLabel}>{section.label}</div>

                    {section.searchable && (
                      <div className={styles.sectionSearch}>
                        <input
                          type="search"
                          placeholder={`Search ${section.label.toLowerCase()}...`}
                          value={searches[section.label] || ""}
                          onChange={(e) =>
                            updateSearch(section.label, e.target.value)
                          }
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
                              onChange={() => section.refine(item.value)}
                            />
                            <span className={styles.label}>
                              {item.label}{" "}
                              <span className={styles.count}>
                                ({item.count})
                              </span>
                            </span>
                          </label>
                        ))
                      ) : (
                        <div className={styles.noResults}>No results found</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with actions */}
            <div className={styles.footer}>
              {canRefine && (
                <button
                  onClick={() => clearRefinements()}
                  className={styles.clearButton}
                  type="button"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className={styles.applyButton}
                type="button"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}