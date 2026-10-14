// components/modules/Catalog/Skeleton.tsx
import type { GridVariant } from "./index";
import type { CatalogView } from "./ViewToggle";
import gridStyles from "./styles.module.scss";
import rowStyles from "@/components/modules/Cards/ListRow/styles.module.scss";
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

const THUMBS: Record<GridVariant, string> = {
  book: rowStyles.thumbBook,
  author: rowStyles.thumbAuthor,
  series: rowStyles.thumbSeries,
};

/** A list-view row, laid out by the real rows' own styles so nothing shifts when results arrive */
function RowSkeleton({ variant }: { variant: GridVariant }) {
  return (
    <div className={`${rowStyles.row} ${styles.row}`}>
      <div className={`${rowStyles.thumb} ${THUMBS[variant]} ${styles.block}`} />
      <div className={rowStyles.details}>
        <div className={`${styles.block} ${styles.line}`} style={{ width: "40%" }} />
        <div className={`${styles.block} ${styles.line} ${styles.small}`} style={{ width: "22%" }} />
        <div className={`${styles.block} ${styles.line} ${styles.small}`} style={{ width: "90%" }} />
        <div className={`${styles.block} ${styles.line} ${styles.small}`} style={{ width: "70%" }} />
      </div>
      <div className={rowStyles.actions}>
        <div className={`${styles.block} ${styles.button}`} />
      </div>
    </div>
  );
}

/** Placeholder cards or rows shown while a catalog's first results load */
export default function CatalogSkeleton({
  variant,
  count,
  view = "grid",
}: {
  variant: GridVariant;
  count: number;
  view?: CatalogView;
}) {
  if (view === "list") {
    return (
      <div className={gridStyles.list} aria-busy="true" aria-label="Loading results">
        {Array.from({ length: count }, (_, i) => (
          <RowSkeleton key={i} variant={variant} />
        ))}
      </div>
    );
  }

  const Card = CARDS[variant];
  return (
    <div className={GRIDS[variant]} aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} />
      ))}
    </div>
  );
}
