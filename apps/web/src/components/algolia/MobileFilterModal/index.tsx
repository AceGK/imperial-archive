// components/algolia/MobileFilterModal/index.tsx
"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useClearRefinements, useRefinementList } from "react-instantsearch";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/Accordion";
import styles from "./styles.module.scss";
import FilterIcon from "@/components/icons/filter.svg";

type FilterConfig = {
  attribute: string;
  label: string;
  searchable?: boolean;
  limit?: number;
};

type MobileFilterModalProps = {
  filters: FilterConfig[];
  buttonLabel?: string;
};

function FilterSection({ 
  config, 
  searchQuery, 
  onSearchChange 
}: { 
  config: FilterConfig;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  const { items, refine } = useRefinementList({
    attribute: config.attribute,
    sortBy: ["name:asc"],
    limit: config.limit ?? 100,
  });

  if (items.length === 0) return null;

  const filteredItems = searchQuery
    ? items.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const refinedCount = items.filter((item) => item.isRefined).length;

  return (
    <AccordionItem value={config.label}>
      <AccordionTrigger>
        <div className={styles.accordionTriggerContent}>
          <span>{config.label}</span>
          {refinedCount > 0 && (
            <span className={styles.refinedBadge}>{refinedCount}</span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className={styles.section}>
          {config.searchable && (
            <div className={styles.sectionSearch}>
              <input
                type="search"
                placeholder={`Search ${config.label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
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
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function MobileFilterModal({
  filters,
  buttonLabel = "Filter",
}: MobileFilterModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searches, setSearches] = React.useState<Record<string, string>>({});
  const [mounted, setMounted] = React.useState(false);
  const { canRefine, refine: clearRefinements } = useClearRefinements();

  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  const modalContent = isOpen ? (
    <>
      <div className={styles.backdrop} onClick={() => setIsOpen(false)} />

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
          <Accordion type="multiple" defaultValue={[]}>
            {filters.map((config) => (
              <FilterSection
                key={config.attribute}
                config={config}
                searchQuery={searches[config.label] || ""}
                onSearchChange={(value) =>
                  setSearches((prev) => ({ ...prev, [config.label]: value }))
                }
              />
            ))}
          </Accordion>
        </div>

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
  ) : null;

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.triggerButton}
        onClick={() => setIsOpen(true)}
        aria-label={buttonLabel}
      >
        <FilterIcon />
        {buttonLabel}
        {canRefine && <span className={styles.badge} />}
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </div>
  );
}