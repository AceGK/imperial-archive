// components/algolia/CurrentRefinements/index.tsx
"use client";

import { useCurrentRefinements, useClearRefinements } from "react-instantsearch";
import styles from "./styles.module.scss";
import Xmark from "@/components/icons/xmark.svg";

type CurrentRefinementsProps = {
  excludedAttributes?: string[];
  showClearAll?: boolean;
  transformLabel?: (attribute: string) => string;
};

// Default label transformer - converts "authors.name" to "Author"
const defaultTransformLabel = (attribute: string): string => {
  // Handle nested attributes like "authors.name" -> "Author"
  const base = attribute.split('.')[0];
  
  // Remove trailing 's' and capitalize
  const singular = base.endsWith('s') ? base.slice(0, -1) : base;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
};

export function CurrentRefinements({
  excludedAttributes = [],
  showClearAll = true,
  transformLabel = defaultTransformLabel,
}: CurrentRefinementsProps) {
  const { items, refine } = useCurrentRefinements({
    excludedAttributes,
  });
  const { canRefine: canClearAll, refine: clearAll } = useClearRefinements({
    excludedAttributes,
  });

  if (items.length === 0) return null;

  // Count total refinements
  const totalRefinements = items.reduce(
    (sum, item) => sum + item.refinements.length,
    0
  );

  return (
    <div className={styles.refinements}>
      {items.map((item) =>
        item.refinements.map((refinement) => (
          <button
            key={`${item.attribute}-${refinement.value}`}
            className={styles.pill}
            onClick={() => refine(refinement)}
            type="button"
          >
            <span className={styles.attribute}>
              {transformLabel(item.attribute)}:
            </span>
            <span className={styles.value}>
              {refinement.label || String(refinement.value)}
            </span>
            <span className={styles.remove}>
              <Xmark />
            </span>
          </button>
        ))
      )}

      {showClearAll && canClearAll && totalRefinements > 1 && (
        <button
          className={styles.clearAll}
          onClick={() => clearAll()}
          type="button"
        >
          Clear all
        </button>
      )}
    </div>
  );
}