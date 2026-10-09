import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toPlainText } from "@portabletext/react";
import InfoHeader from "@/components/modules/InfoHeader";
import RichText from "@/components/ui/RichText";
import JsonLd from "@/components/seo/JsonLd";
import { client } from "@/lib/sanity/sanity.client";
import { blogPostBySlugQuery, blogPostSlugsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";
import TocLayout from "@/components/modules/Toc/TocLayout";
import { formatPostDate, postSections } from "@/lib/blog";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, SITE_NAME, truncate } from "@/lib/seo";
import type { BlogPostDoc } from "@/types/sanity";
import styles from "./styles.module.scss";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await client.fetch<string[]>(blogPostSlugsQuery);
  return slugs.map((slug) => ({ slug }));
}

async function getPost(slug: string) {
  return client.fetch<BlogPostDoc | null>(blogPostBySlugQuery, { slug });
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };

  const description =
    post.metaDescription || (post.body ? truncate(toPlainText(post.body)) : undefined);
  return {
    ...pageMetadata({
      title: post.metaTitle || post.title,
      description,
      path: `/blog/${post.slug}`,
      image: post.mainImage?.asset
        ? urlFor(post.mainImage).width(1200).height(630).fit("crop").auto("format").url()
        : undefined,
      imageAlt: post.mainImage?.alt || post.title,
    }),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const cover = post.mainImage?.asset ? post.mainImage : null;
  const dims = cover?.asset?.metadata?.dimensions;
  const coverWidth = 1520;
  const category = post.categories?.find((c) => c !== "Blog") ?? null;
  const path = `/blog/${post.slug}`;
  const sections = postSections(post.body);
  const showToc = sections.items.length >= 2;

  const article = (
    <article className={styles.content}>
      <Link href="/blog" className={styles.back}>
        ← All dispatches
      </Link>

      <InfoHeader
        label={category}
        title={post.title}
      >
        <p className={styles.meta}>
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>}
          {post.author && <span>By {post.author}</span>}
        </p>
      </InfoHeader>

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
    </article>
  );

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.metaDescription || undefined,
            url: absoluteUrl(path),
            image: cover ? urlFor(cover).width(1200).auto("format").url() : undefined,
            datePublished: post.publishedAt || undefined,
            dateModified: post._updatedAt,
            author: post.author
              ? { "@type": "Person", name: post.author }
              : { "@type": "Organization", name: SITE_NAME },
            publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
          },
          breadcrumbJsonLd([
            { name: "Blog", path: "/blog" },
            { name: post.title, path },
          ]),
        ]}
      />

      <section className="container row__md">
        {showToc ? <TocLayout items={sections.items}>{article}</TocLayout> : article}
      </section>
    </main>
  );
}
