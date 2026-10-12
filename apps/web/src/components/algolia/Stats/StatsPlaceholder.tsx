// components/algolia/Stats/StatsPlaceholder.tsx
import styles from "./styles.module.scss";

/** Stands in for the result count ("1,157 Publications") while the first results load */
export function StatsPlaceholder() {
  return (
    <div className={styles.stats}>
      <span className={styles.placeholder} aria-hidden="true" />
    </div>
  );
}
