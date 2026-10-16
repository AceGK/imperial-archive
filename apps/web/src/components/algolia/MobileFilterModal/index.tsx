// components/algolia/MobileFilterModal/index.tsx
"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useClearRefinements, useCurrentRefinements, useRefinementList, useStats } from "react-instantsearch";
import Button from "@/components/ui/Button";
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

/** One group's options, shown when its tab is selected */
function FilterPanel({
  config,
  id,
  tabId,
  hidden,
  searchQuery,
  onSearchChange,
}: {
  config: FilterConfig;
  id: string;
  tabId: string;
  hidden: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  const { items, refine } = useRefinementList({
    attribute: config.attribute,
    sortBy: ["name:asc"],
    limit: config.limit ?? 100,
  });

  const filteredItems = searchQuery
    ? items.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  return (
    <div id={id} role="tabpanel" aria-labelledby={tabId} hidden={hidden} className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>{config.label}</span>
        {config.searchable && items.length > 0 && (
          <input
            type="search"
            placeholder={`Search ${config.label.toLowerCase()}...`}
            aria-label={`Search ${config.label.toLowerCase()}`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        )}
      </div>

      <div className={styles.items}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <label key={item.value} className={styles.checkbox}>
              <input type="checkbox" checked={item.isRefined} onChange={() => refine(item.value)} />
              <span className={styles.label}>
                {item.label} <span className={styles.count}>({item.count})</span>
              </span>
            </label>
          ))
        ) : (
          <div className={styles.noResults}>{items.length === 0 ? "No options for these results" : "No matches"}</div>
        )}
      </div>
    </div>
  );
}

export function MobileFilterModal({ filters, buttonLabel = "Filter" }: MobileFilterModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [searches, setSearches] = React.useState<Record<string, string>>({});
  const [mounted, setMounted] = React.useState(false);
  const { canRefine, refine: clearRefinements } = useClearRefinements();
  const { items: current } = useCurrentRefinements();
  const { nbHits } = useStats();
  const baseId = React.useId();
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // how many options are chosen in each group, for the badges beside the group names
  const chosen = (attribute: string) =>
    current.filter((item) => item.attribute === attribute).reduce((n, item) => n + item.refinements.length, 0);

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

  // up/down move between the groups, as in a vertical tab list
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowDown" ? 1 : -1) + filters.length) % filters.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = (i: number) => `${baseId}-panel-${i}`;

  const modalContent = isOpen ? (
    <>
      <div className={styles.backdrop} onClick={() => setIsOpen(false)} />

      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={`${baseId}-title`}>
        <div className={styles.header}>
          <span id={`${baseId}-title`}>Filters</span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>

        {/* the groups on the left, the selected group's options on the right */}
        <div className={styles.body}>
          <div className={styles.groups} role="tablist" aria-orientation="vertical" aria-label="Filter groups">
            {filters.map((config, i) => {
              const count = chosen(config.attribute);
              return (
                <button
                  key={config.attribute}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={tabId(i)}
                  aria-selected={active === i}
                  aria-controls={panelId(i)}
                  tabIndex={active === i ? 0 : -1}
                  className={styles.group}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                >
                  <span>{config.label}</span>
                  {count > 0 && (
                    <span className={styles.groupCount} aria-label={`${count} selected`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filters.map((config, i) => (
            <FilterPanel
              key={config.attribute}
              config={config}
              id={panelId(i)}
              tabId={tabId(i)}
              hidden={active !== i}
              searchQuery={searches[config.label] || ""}
              onSearchChange={(value) => setSearches((prev) => ({ ...prev, [config.label]: value }))}
            />
          ))}
        </div>

        <div className={styles.footer}>
          <Button
            variant="secondary"
            size="lg"
            className={styles.footerButton}
            onClick={() => clearRefinements()}
            disabled={!canRefine}
          >
            Clear all
          </Button>
          {/* filters apply as they're ticked, so this just closes on the current results */}
          <Button variant="primary" size="lg" className={styles.footerButton} onClick={() => setIsOpen(false)}>
            Show {nbHits.toLocaleString()} {nbHits === 1 ? "result" : "results"}
          </Button>
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className={styles.wrapper}>
      <button className={styles.triggerButton} onClick={() => setIsOpen(true)} aria-label={buttonLabel}>
        <FilterIcon />
        {buttonLabel}
        {canRefine && <span className={styles.badge} />}
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </div>
  );
}
