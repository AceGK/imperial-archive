import type { CSSProperties } from "react";
import { urlFor } from "@/lib/sanity/sanity.image";
import styles from "./styles.module.scss";

export type BookWallCover = {
  _id: string;
  title: string;
  image: unknown;
};

const colorOf = (image: BookWallCover["image"]) => {
  const color = (image as { asset?: { color?: string | null } })?.asset?.color;
  // only a plain hex color goes into the stylesheet
  return color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : null;
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
      // small and soft is fine: the wall sits under a dark, blurred overlay
      urlFor(c.image).width(280).height(420).fit("crop").quality(50).auto("format").url()
    );
  if (urls.length === 0) return null;

  // The wall repeats each cover several times (twice per column, so the loop
  // is seamless), so each cover's image and placeholder color are written once
  // here and the tiles point at them by number. Inline <img> tags repeated the
  // full image URL on every tile, and base64 blur previews were ~0.7KB each:
  // together over 150KB of the homepage, sent in the HTML and again in the
  // React payload. The tiles are empty boxes now; the cover is their background.
  const css = urls
    .map((url, i) => {
      const color = images ? null : colorOf(covers[i]?.image);
      return `.${styles.wall} [data-cover="${i}"]{background-image:url("${url}")${color ? `;background-color:${color}` : ""}}`;
    })
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
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={styles.zoom}>
        <div className={styles.plane}>
          <div className={styles.track}>
            {grid.map((column, col) => (
              <div key={col} className={styles.column}>
                {[...column, ...column].map((cover, i) => (
                  <span key={i} data-cover={cover} className={styles.cover} />
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
