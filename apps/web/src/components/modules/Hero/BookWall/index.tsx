import type { CSSProperties } from "react";
import { urlFor } from "@/lib/sanity/sanity.image";
import styles from "./styles.module.scss";

export type BookWallCover = {
  _id: string;
  title: string;
  image: unknown;
};

const lqipOf = (image: BookWallCover["image"]) =>
  (image as { asset?: { metadata?: { lqip?: string | null } } })?.asset?.metadata?.lqip ?? null;

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
      // small and soft is fine: the wall sits under a dark, blurred overlay
      urlFor(c.image).width(280).height(420).fit("crop").quality(50).auto("format").url()
    );
  if (urls.length === 0) return null;

  // Each cover's blurred preview (Sanity's LQIP, ~0.7KB) shows from the first
  // paint and the full image draws over it once loaded, so no tile is ever
  // empty. The wall repeats every cover several times, so each preview is
  // written once here and tiles point at it by number, rather than inlining it
  // on every tile.
  const previews = images ? [] : covers.map((c) => lqipOf(c.image));
  const previewCss = previews
    .map((lqip, i) => (lqip ? `.${styles.wall} [data-cover="${i}"]{background-image:url("${lqip}")}` : ""))
    .join("");

  const grid = Array.from({ length: columns }, (_, col) =>
    Array.from({ length: rows }, (_, row) => (col * rows + row) % urls.length)
  );

  return (
    <div
      className={styles.wall}
      style={{ "--cols": columns, "--rows": rows, ...(coverWidth && { "--w": coverWidth }) } as CSSProperties}
      aria-hidden="true"
    >
      {previewCss && <style dangerouslySetInnerHTML={{ __html: previewCss }} />}
      <div className={styles.zoom}>
        <div className={styles.plane}>
          <div className={styles.track}>
            {grid.map((column, col) => (
              <div key={col} className={styles.column}>
                {[...column, ...column].map((cover, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={urls[cover]}
                    data-cover={cover}
                    alt=""
                    width={280}
                    height={420}
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
