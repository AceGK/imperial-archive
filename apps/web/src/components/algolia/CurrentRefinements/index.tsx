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

const defaultTransformLabel = (attribute: string): string => {
  const labelMap: Record<string, string> = {
    // Books index
    'format': 'Format',
    'authors.name': 'Author',
    'series.title': 'Series',
    'factions.name': 'Faction',
    'era.name': 'Era',
    // Authors/Series indices
    'bookFormats': 'Format',
    'authorNames': 'Author',
    'seriesTitles': 'Series',
    'factionNames': 'Faction',
    'eraNames': 'Era',
  };

  return labelMap[attribute] ?? attribute;
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

  // Flatten and sort refinements for stable order
  const sortedRefinements = items
    .flatMap((item) =>
      item.refinements.map((refinement) => ({
        item,
        refinement,
      }))
    )
    .sort((a, b) => {
      // Sort by attribute first, then by value
      const attrCompare = a.item.attribute.localeCompare(b.item.attribute);
      if (attrCompare !== 0) return attrCompare;
      return String(a.refinement.value).localeCompare(String(b.refinement.value));
    });

  return (
    <div className={styles.refinements}>
      {sortedRefinements.map(({ item, refinement }) => (
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
      ))}

      {showClearAll && canClearAll && sortedRefinements.length > 1 && (
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