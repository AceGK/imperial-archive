// components/modules/Cards/BookCard/Skeleton.tsx
import styles from "./styles.module.scss";

export default function BookCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.skeletonCover} />
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonAuthor} />
    </div>
  );
}