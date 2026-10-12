// components/algolia/RefinementList/FilterButtonSkeleton.tsx
import ChevronDown from "@/components/icons/chevron-down.svg";
import styles from "./styles.module.scss";

/**
 * Stands in for a filter button while its values load. Sized by the same
 * label and chevron as the real button, which are hidden behind a shimmer.
 */
export function FilterButtonSkeleton({ title }: { title: string }) {
  return (
    <span className={`${styles.filterButton} ${styles.skeleton}`} aria-hidden="true">
      {title}
      <ChevronDown className={styles.chevron} />
    </span>
  );
}
