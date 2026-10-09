import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/types/sanity";
import { urlFor } from "@/lib/sanity/sanity.image";
import { formatPostDate } from "@/lib/blog";
import styles from "./styles.module.scss";

/** Post preview for the /blog grid: cover, category, title, date, and excerpt */
export default function BlogCard({ post }: { post: BlogPost }) {
  const image = post.mainImage?.asset ? post.mainImage : null;
  const category = post.categories?.find((c) => c !== "Blog") ?? null;

  return (
    <Link href={`/blog/${post.slug}`} className={styles.card}>
      <div className={styles.media}>
        {image ? (
          <Image
            src={urlFor(image).width(800).height(450).fit("crop").auto("format").url()}
            alt={image.alt || ""}
            fill
            sizes="(max-width: 576px) 100vw, 380px"
            placeholder={image.asset?.metadata?.lqip ? "blur" : "empty"}
            blurDataURL={image.asset?.metadata?.lqip}
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true" />
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>}
          {category && <span className={styles.category}>{category}</span>}
        </div>
        <h2 className={styles.title}>{post.title}</h2>
        {post.metaDescription && <p className={styles.excerpt}>{post.metaDescription}</p>}
        <span className={styles.readMore}>Read dispatch →</span>
      </div>
    </Link>
  );
}
