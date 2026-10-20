import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toPlainText } from "@portabletext/react";
import Article from "@/components/modules/Article";
import JsonLd from "@/components/seo/JsonLd";
import { client } from "@/lib/sanity/sanity.client";
import { blogPostBySlugQuery, blogPostSlugsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, SITE_NAME, truncate } from "@/lib/seo";
import type { BlogPostDoc } from "@/types/sanity";
import PostNav from "./PostNav";

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
  const category = post.categories?.find((c) => c !== "Blog") ?? null;
  const path = `/blog/${post.slug}`;

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

      <Article
        post={post}
        label={category}
        back={{ href: "/blog", label: "All dispatches" }}
        shareHeading="Share this dispatch"
        sharePath={path}
        footer={<PostNav prev={post.prev} next={post.next} />}
      />
    </main>
  );
}
