// Standalone pages built in the studio ("Pages"), e.g. /terms and /privacy.
// The site's own routes (/about, /books, …) take priority over this one, so it
// only answers for slugs they don't use; anything unknown is a 404.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/types";
import InfoHeader from "@/components/modules/InfoHeader";
import TocLayout from "@/components/modules/Toc/TocLayout";
import RichText from "@/components/ui/RichText";
import { client } from "@/lib/sanity/sanity.client";
import { pageBySlugQuery } from "@/lib/sanity/queries";
import { postSections } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";
import styles from "./styles.module.scss";

export const revalidate = 60;

type SanityPage = {
  _id: string;
  title: string;
  slug: string;
  label?: string | null;
  description?: string | null;
  updated?: string | null;
  body?: PortableTextBlock[] | null;
  noindex?: boolean | null;
};

type Props = { params: Promise<{ slug: string }> };

function getPage(slug: string) {
  return client.fetch<SanityPage | null>(pageBySlugQuery, { slug }, { next: { revalidate } });
}

/** "2026-10-12" -> "October 12, 2026" (UTC, so server and client agree) */
function formatUpdated(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.description ?? undefined,
    path: `/${page.slug}`,
    noindex: page.noindex === true,
  });
}

export default async function SanityPageRoute({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  // H1/H2 headings become sections; with two or more, a contents rail is shown
  const sections = postSections(page.body);
  const showToc = sections.items.length >= 2;

  const header = (
    <InfoHeader label={page.label ?? undefined} title={page.title}>
      {page.updated && <p className={styles.meta}>Last updated {formatUpdated(page.updated)}</p>}
    </InfoHeader>
  );

  const body = (
    <div className={`${styles.body} rich-text`}>
      <RichText value={page.body} headingIds={sections.headingIds} />
    </div>
  );

  return (
    <main>
      <section className="container row__md">
        {showToc ? (
          <TocLayout items={sections.items} header={header}>
            <article>{body}</article>
          </TocLayout>
        ) : (
          <article className={styles.content}>
            {header}
            {body}
          </article>
        )}
      </section>
    </main>
  );
}
