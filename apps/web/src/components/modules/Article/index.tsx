import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PortableTextBlock } from "@portabletext/types";
import InfoHeader from "@/components/modules/InfoHeader";
import RichText from "@/components/ui/RichText";
import ArrowLeftIcon from "@/components/icons/arrow-left.svg";
import TocLayout from "@/components/modules/Toc/TocLayout";
import { ShareLinks } from "@/components/modules/Share";
import { formatPostDate, postSections } from "@/lib/blog";
import { urlFor } from "@/lib/sanity/sanity.image";
import type { BlogPost } from "@/types/sanity";
import styles from "./styles.module.scss";

type ArticlePost = Pick<BlogPost, "title" | "publishedAt" | "author" | "mainImage"> & {
  body?: PortableTextBlock[] | null;
};

/**
 * A Sanity post as a page: header, cover, body with a contents rail once it
 * has two or more sections, and share links. Blog posts and reading guides
 * both render through this; each page supplies its own wording and links.
 */
export default function Article({
  post,
  label,
  back,
  shareHeading,
  sharePath,
  footer,
}: {
  post: ArticlePost;
  /** Small line above the title, e.g. the post's category */
  label?: string | null;
  /** A link back to the list the post belongs to */
  back?: { href: string; label: string };
  shareHeading: string;
  /** The page's own path, for the share links */
  sharePath: string;
  /** Under the article, e.g. links to the previous and next posts */
  footer?: ReactNode;
}) {
  const cover = post.mainImage?.asset ? post.mainImage : null;
  const dims = cover?.asset?.metadata?.dimensions;
  const coverWidth = 1520;
  const sections = postSections(post.body);
  const showToc = sections.items.length >= 2;

  const header = (
    <div>
      {back && (
        <Link href={back.href} className={styles.back}>
          <ArrowLeftIcon aria-hidden="true" />
          <span>{back.label}</span>
        </Link>
      )}

      <InfoHeader label={label} title={post.title}>
        <p className={styles.meta}>
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>}
          {post.author && <span>By {post.author}</span>}
        </p>
      </InfoHeader>
    </div>
  );

  // with a contents rail the header and footer span it and the article (see
  // TocLayout); without one they stay in the article column
  const article = (
    <article className={styles.content}>
      {!showToc && header}

      {cover && dims && (
        <div className={styles.cover}>
          <Image
            src={urlFor(cover).width(coverWidth).auto("format").url()}
            alt={cover.alt || ""}
            width={coverWidth}
            height={Math.round(coverWidth / dims.aspectRatio)}
            sizes="(max-width: 800px) 100vw, 760px"
            priority
            placeholder={cover.asset?.metadata?.lqip ? "blur" : "empty"}
            blurDataURL={cover.asset?.metadata?.lqip}
          />
        </div>
      )}

      <div className={`${styles.body} rich-text`}>
        <RichText value={post.body} headingIds={sections.headingIds} />
      </div>

      <footer className={styles.share}>
        <h2 className={styles.shareHeading}>{shareHeading}</h2>
        <ShareLinks url={sharePath} title={post.title} />
      </footer>

      {!showToc && footer}
    </article>
  );

  return (
    <section className="container row__md">
      {showToc ? (
        <TocLayout items={sections.items} header={header} footer={footer}>
          {article}
        </TocLayout>
      ) : (
        article
      )}
    </section>
  );
}
