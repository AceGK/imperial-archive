import type { CSSProperties } from "react";
import { urlFor } from "@/lib/sanity/sanity.image";
import styles from "./styles.module.scss";

export type BookWallCover = {
  _id: string;
  title: string;
  image: unknown;
};

type Props = {
  /** Sanity covers; or pass `images` for plain image URLs */
  covers?: BookWallCover[];
  /** Plain cover image URLs (e.g. files in /public), used in place of `covers` */
  images?: string[];
  /** Cover width, any CSS length; the default scales with the viewport for the hero */
  coverWidth?: string;
  /** Columns across the tilted wall; enough to cover ultra-wide screens */
  columns?: number;
  /** Covers per column before the column repeats */
  rows?: number;
};

/**
 * Decorative hero background: a tilted wall of book covers that drifts
 * diagonally forever. The motion is pure CSS (one transformed layer), so it
 * runs on the compositor with no client JS. Each column holds its covers
 * twice and the wall slides up by exactly one set before looping.
 */
export default function BookWall({ covers = [], images, coverWidth, columns = 14, rows = 8 }: Props) {
  const urls =
    images ??
    covers.map((c) =>
      urlFor(c.image).width(320).height(480).fit("crop").quality(60).auto("format").url()
    );
  if (urls.length === 0) return null;

  const grid = Array.from({ length: columns }, (_, col) =>
    Array.from({ length: rows }, (_, row) => urls[(col * rows + row) % urls.length])
  );

  return (
    <div
      className={styles.wall}
      style={{ "--cols": columns, "--rows": rows, ...(coverWidth && { "--w": coverWidth }) } as CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.zoom}>
        <div className={styles.plane}>
          <div className={styles.track}>
            {grid.map((column, col) => (
              <div key={col} className={styles.column}>
                {[...column, ...column].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt=""
                    width={320}
                    height={480}
                    decoding="async"
                    draggable={false}
                    className={styles.cover}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.shade} />
    </div>
  );
}
