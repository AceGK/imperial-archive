import Image from "next/image";
import Link from "next/link";
import ChevronLeft from "@/components/icons/chevron-left.svg";
import ChevronRight from "@/components/icons/chevron-right.svg";
import { urlFor } from "@/lib/sanity/sanity.image";
import type { BlogPostNeighbor } from "@/types/sanity";
// shares the article's stylesheet, where the post links are styled
import styles from "@/components/modules/Article/styles.module.scss";

/** Links to the older and newer posts, each with its cover and title */
export default function PostNav({
  prev,
  next,
}: {
  prev?: BlogPostNeighbor | null;
  next?: BlogPostNeighbor | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav className={styles.postNav} aria-label="More dispatches">
      {prev && <NavLink post={prev} direction="prev" />}
      {next && <NavLink post={next} direction="next" />}
    </nav>
  );
}

function NavLink({ post, direction }: { post: BlogPostNeighbor; direction: "prev" | "next" }) {
  const image = post.mainImage?.asset ? post.mainImage : null;
  const Chevron = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <Link
      href={`/blog/${post.slug}`}
      rel={direction}
      className={`${styles.navLink} ${direction === "next" ? styles.navNext : ""}`}
    >
      <div className={styles.navMedia}>
        {image ? (
          <Image
            src={urlFor(image).width(480).height(270).fit("crop").auto("format").url()}
            alt=""
            fill
            sizes="(max-width: 576px) 45vw, 240px"
            placeholder={image.asset?.metadata?.lqip ? "blur" : "empty"}
            blurDataURL={image.asset?.metadata?.lqip}
            className={styles.navImage}
          />
        ) : (
          <div className={styles.navPlaceholder} aria-hidden="true" />
        )}
      </div>
      <span className={styles.navTitle}>{post.title}</span>
      <span className={styles.navLabel}>
        <Chevron className={styles.navChevron} aria-hidden="true" />
        <span>{direction === "prev" ? "Prev dispatch" : "Next dispatch"}</span>
      </span>
    </Link>
  );
}
