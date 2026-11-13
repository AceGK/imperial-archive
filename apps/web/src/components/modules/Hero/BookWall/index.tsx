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
// small and soft is fine: the wall sits under a dark, blurred overlay
const coverUrl = (image: unknown, width: number) =>
  urlFor(image).width(width).height(width * 1.5).fit("crop").quality(50).auto("format").url();

// Up to this width the tiles are at their 130px minimum (--w in the styles:
// 14vw is under 130px below ~929px), so a 200px cover is enough; the full
// 280px cover is ~40% heavier. Change both together.
const SMALL_TILES = "(max-width: 928px)";

export default function BookWall({ covers = [], images, coverWidth, columns = 14, rows = 8 }: Props) {
  const urls = images ?? covers.map((c) => coverUrl(c.image, 280));
  const smallUrls = images || coverWidth ? null : covers.map((c) => coverUrl(c.image, 200));
  if (urls.length === 0) return null;

  // The wall repeats each cover several times (twice per column, so the loop
  // is seamless), so each cover's image and placeholder color are written once
  // here and the tiles point at them by number. Inline <img> tags repeated the
  // full image URL on every tile, and base64 blur previews were ~0.7KB each:
  // together over 150KB of the homepage, sent in the HTML and again in the
  // React payload. The tiles are empty boxes now; the cover is their background.
  const rule = (url: string, i: number, color?: string | null) =>
    `.${styles.wall} [data-cover="${i}"]{background-image:url("${url}")${color ? `;background-color:${color}` : ""}}`;
  const css =
    urls.map((url, i) => rule(url, i, images ? null : colorOf(covers[i]?.image))).join("") +
    // only the cover a tile ends up showing is downloaded, so phones skip the large ones
    (smallUrls ? `@media ${SMALL_TILES}{${smallUrls.map((url, i) => rule(url, i)).join("")}}` : "");

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
