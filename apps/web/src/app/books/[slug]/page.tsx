// app/books/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { bookSlugs40kQuery, bookBySlug40kQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";
import BookDetail from "@/components/modules/BookDetails";
import AuthorBooksCarousel from "@/components/modules/Carousel/AuthorBooksCarousel";
import SeriesBooksCarousel from "@/components/modules/Carousel/SeriesBooksCarousel";
import RecentlyViewedCarousel from "@/components/modules/Carousel/RecentlyViewedCarousel";
import JsonLd from "@/components/seo/JsonLd";
import { bookJsonLd, breadcrumbJsonLd, pageMetadata, truncate } from "@/lib/seo";
import { bookDescription } from "@/lib/descriptions";
import { coverAlt } from "@/lib/covers";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs: { slug: string }[] = await client.fetch(bookSlugs40kQuery);
  return slugs.map((s) => ({ slug: s.slug }));
}

/**
 * The book's place in its first series: its number in the first ordered
 * reading list that includes it, or just the series name when it's only in
 * unordered lists
 */
function seriesPosition(book: any): { name: string; position: number | null } | null {
  const navs: any[] = Array.isArray(book.seriesNavigation) ? book.seriesNavigation : [];
  for (const nav of navs) {
    for (const list of nav?.lists ?? []) {
      if (!list?.ordered) continue;
      const index = (list.allBooks ?? []).findIndex((b: any) => b?._id === book._id);
      if (index >= 0 && nav.seriesName) return { name: nav.seriesName, position: index + 1 };
    }
  }
  const name = navs.find((n) => n?.seriesName)?.seriesName;
  return name ? { name, position: null } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await client.fetch(bookBySlug40kQuery, { slug });

  if (!book) {
    return {
      title: "Book Not Found",
    };
  }

  const authorsText =
    book.authors
      ?.map((a: any) => a?.name)
      .filter(Boolean)
      .join(", ") || "Unknown Author";

  // generated from the book's own data (author, series order, format, year),
  // with the publisher blurb after it where there's room
  const description = bookDescription({
    title: book.title,
    authors: (book.authors ?? []).map((a: any) => a?.name).filter(Boolean),
    format: book.format,
    year: book.publication_date ? String(book.publication_date).slice(0, 4) : null,
    series: seriesPosition(book),
    blurb: book.description || book.story,
  });

  const imageUrl = book?.image?.asset?.url
    ? urlFor(book.image)
        .width(1200)
        .height(630)
        .auto("format")
        .fit("crop")
        .url()
    : undefined;

  const imgAlt = coverAlt(book.title, book.authors, book.image?.alt);

  return pageMetadata({
    title: `${book.title} by ${authorsText}`,
    description: truncate(description),
    path: `/books/${book.slug}`,
    image: imageUrl,
    imageAlt: imgAlt,
    type: "book",
  });
}

export default async function BookPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const book = await client.fetch(bookBySlug40kQuery, { slug });

  if (!book) notFound();

  // Check if we should show the author carousel
  const singleAuthor =
    book.authors?.length === 1 && book.authors[0]?.slug && book.authors[0]?.name
      ? book.authors[0]
      : null;

  // Get series info for carousels
  const series = Array.isArray(book.series) ? book.series : [];
  const validSeries = series.filter((s: any) => s?.slug && s?.name);

  const coverUrl = book?.image?.asset?.url
    ? urlFor(book.image).width(800).auto("format").url()
    : undefined;

  return (
    <>
      <JsonLd
        data={[
          bookJsonLd(book, coverUrl),
          breadcrumbJsonLd([
            { name: "Books", path: "/books" },
            { name: book.title, path: `/books/${book.slug}` },
          ]),
        ]}
      />
      <BookDetail book={book} />

      {/* Series carousels - one for each series */}
      {validSeries.map((s: any) => (
        <section key={s.slug} className="container row">
          <SeriesBooksCarousel
            seriesSlug={s.slug}
            seriesName={s.name}
            currentBookId={book._id}
          />
        </section>
      ))}

      {/* Author carousel */}
      {singleAuthor && (
        <section className="container row">
          <AuthorBooksCarousel
            authorSlug={singleAuthor.slug}
            authorName={singleAuthor.name}
            currentBookId={book._id}
          />
        </section>
      )}

      <RecentlyViewedCarousel
        book={{
          _id: book._id,
          title: book.title,
          slug: book.slug,
          authors: (book.authors ?? [])
            .filter((a: any) => a?.name)
            .map((a: any) => ({ name: a.name, slug: a.slug })),
          format: book.format ?? null,
          publication_date: book.publication_date ?? null,
          series: validSeries.map((s: any) => ({ name: s.name, slug: s.slug, number: s.number ?? null })),
          image: book.image?.asset?.url
            ? { url: book.image.asset.url, alt: book.image.alt ?? null }
            : null,
        }}
      />
    </>
  );
}
