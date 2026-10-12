// components/modules/Catalog/Skeleton.tsx
import type { GridVariant } from "./index";
import gridStyles from "./styles.module.scss";
import styles from "./skeleton.module.scss";

const GRIDS: Record<GridVariant, string> = {
  book: gridStyles.bookGrid,
  author: gridStyles.authorGrid,
  series: gridStyles.seriesGrid,
};

function BookSkeleton() {
  return (
    <div className={styles.bookCard}>
      <div className={`${styles.block} ${styles.cover}`} />
      <div className={styles.content}>
        <div className={`${styles.block} ${styles.line}`} style={{ width: "85%" }} />
        <div className={`${styles.block} ${styles.line} ${styles.small}`} style={{ width: "55%" }} />
        <div className={`${styles.block} ${styles.chip}`} />
      </div>
    </div>
  );
}

function AuthorSkeleton() {
  return (
    <div className={styles.authorCard}>
      <div className={`${styles.block} ${styles.avatar}`} />
      <div className={`${styles.block} ${styles.line}`} style={{ width: "50%" }} />
      <div className={`${styles.block} ${styles.line} ${styles.small}`} style={{ width: "25%" }} />
    </div>
  );
}

function SeriesSkeleton() {
  return (
    <div className={styles.seriesCard}>
      <div className={`${styles.block} ${styles.banner}`} />
      <div className={styles.content}>
        <div className={`${styles.block} ${styles.line}`} style={{ width: "70%" }} />
        <div className={`${styles.block} ${styles.line} ${styles.small}`} style={{ width: "40%" }} />
      </div>
    </div>
  );
}

const CARDS: Record<GridVariant, () => React.JSX.Element> = {
  book: BookSkeleton,
  author: AuthorSkeleton,
  series: SeriesSkeleton,
};

/** Placeholder cards shown while a catalog's first results load */
export default function CatalogSkeleton({ variant, count }: { variant: GridVariant; count: number }) {
  const Card = CARDS[variant];
  return (
    <div className={GRIDS[variant]} aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}
