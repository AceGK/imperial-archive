// /app/series/[slug]/page.tsx
import { notFound } from "next/navigation";
import RichText from "@/components/ui/RichText";
import PageHeader from "@/components/modules/PageHeader";
import FavoriteButton from "@/components/modules/FavoriteButton";
import { ShareButton } from "@/components/modules/Share";
import { client } from "@/lib/sanity/sanity.client";
import { series40kBySlugQuery } from "@/lib/sanity/queries";
import type { Series40kDoc } from "@/types/sanity";
import { urlFor } from "@/lib/sanity/sanity.image";
import BookGrid from "@/components/modules/BookGrid";
import type { BookCardData } from "@/components/modules/Cards/BookCard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import type { Metadata } from "next";
import { toPlainText } from "@portabletext/react";
import JsonLd from "@/components/seo/JsonLd";
import {
  absoluteUrl,
  blackLibraryJsonLd,
  breadcrumbJsonLd,
  pageMetadata,
  truncate,
} from "@/lib/seo";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await client.fetch<string[]>(
    `*[_type == "series40k" && defined(slug.current)].slug.current`
  );
  return slugs.map((slug) => ({ slug }));
}

async function getSeries(slug: string) {
  return client.fetch<Series40kDoc | null>(series40kBySlugQuery, { slug });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSeries(slug);
  if (!data) return { title: "Series Not Found" };

  const intro = data.description ? toPlainText(data.description) : data.subtitle;
  return pageMetadata({
    title: `${data.title} Reading Order`,
    description: truncate(
      intro ||
        `The ${data.title} reading order: every book in the Warhammer 40,000 series from Black Library, in order.`
    ),
    path: `/series/${data.slug}`,
    image: data.image?.asset
      ? urlFor(data.image).width(1200).height(630).fit("crop").auto("format").url()
      : undefined,
    imageAlt: data.image?.alt || data.title,
  });
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  const data = await getSeries(slug);
  if (!data) notFound();

  // every book across the series' lists, in reading order, without repeats
  const seen = new Set<string>();
  const seriesBooks = (data.lists ?? [])
    .flatMap((list) => list.items ?? [])
    .map((it: any) => it?.work)
    .filter((w: any) => w?.slug && !seen.has(w.slug) && seen.add(w.slug));

const hero = data.image?.asset
  ? {
      url: urlFor(data.image)
        .width(1600)
        .auto("format")
        .url(),
      lqip: data.image.asset.metadata?.lqip,
      alt: data.image.alt ?? "",
      credit: data.image.credit ?? undefined,
      hotspot: data.image.hotspot,
    }
  : null;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BookSeries",
            name: data.title,
            url: absoluteUrl(`/series/${data.slug}`),
            description: data.description
              ? truncate(toPlainText(data.description), 500)
              : data.subtitle || undefined,
            publisher: blackLibraryJsonLd,
            ...(seriesBooks.length > 0 && {
              numberOfItems: seriesBooks.length,
              hasPart: seriesBooks.map((w: any, i: number) => ({
                "@type": "Book",
                name: w.title,
                url: absoluteUrl(`/books/${w.slug}`),
                position: i + 1,
              })),
            }),
          },
          breadcrumbJsonLd([
            { name: "Series", path: "/series" },
            { name: data.title, path: `/series/${data.slug}` },
          ]),
        ]}
      />
      <PageHeader
        title={data.title}
        subtitle={data.subtitle || `Stories from the ${data.title} series.`}
        align="center"
        strongOverlay
        height="sm"
        priority
        image={hero}
        alt={hero?.alt}
        credit={hero?.credit}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem" }}>
          <FavoriteButton kind="series" itemId={data._id} variant="overlay" />
          <ShareButton
            url={`/series/${data.slug}`}
            title={`${data.title} reading order`}
            variant="overlay"
            align="center"
          />
        </div>
      </PageHeader>

      <main>
        <div className="container">
        <Breadcrumb />
        {data.description && (
            <div className="rich-text">
              <RichText value={data.description} />
            </div>
        )}

        {data.lists?.length ? (
          <div style={{ display: "grid", gap: "1.75rem" }}>
            {data.lists.map((list, li) => {
              const books: BookCardData[] = (list.items ?? [])
                .map((it: any) => it?.work)
                .filter(Boolean) as BookCardData[];

              return (
                <section
                  key={list.key ?? `${li}`}
                  style={{ display: "grid", gap: "0.75rem" }}
                >
                  <header>
                    <h2
                      style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {list.title}
                    </h2>
                    {list.description && (
                      <p
                        style={{
                          margin: "0.25rem 0 0",
                          color: "var(--subtle)",
                        }}
                      >
                        {list.description}
                      </p>
                    )}
                  </header>

                  <BookGrid
                    books={books}
                    noResultsText="No books in this list yet."
                  />
                </section>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "2rem 0", opacity: 0.6 }}>
            <em>No books linked yet.</em>
          </div>
        )}
        </div>
      </main>
    </>
  );
}
