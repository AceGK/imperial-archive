// app/books/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { bookSlugs40kQuery, bookBySlug40kQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";
import BookDetail from "@/components/modules/BookDetails";
import AuthorBooksCarousel from "@/components/modules/Carousel/AuthorBooksCarousel";
import SeriesBooksCarousel from "@/components/modules/Carousel/SeriesBooksCarousel";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs: { slug: string }[] = await client.fetch(bookSlugs40kQuery);
  return slugs.map((s) => ({ slug: s.slug }));
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

  const description =
    book.description ||
    book.story ||
    `${book.title} by ${authorsText}${book.format ? ` - ${book.format}` : ""}`;

  const imageUrl = book?.image?.asset?.url
    ? urlFor(book.image)
        .width(1200)
        .height(630)
        .auto("format")
        .fit("crop")
        .url()
    : undefined;

  const imgAlt =
    (book?.image?.alt && String(book.image.alt).trim()) ||
    `${book.title} cover`;

  return {
    title: `${book.title} by ${authorsText}`,
    description: description.substring(0, 160),
    openGraph: {
      title: book.title,
      description: description.substring(0, 160),
      type: "book",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: imgAlt,
            },
          ]
        : undefined,
      ...(book.authors?.[0]?.name && {
        authors: book.authors.map((a: any) => a.name).filter(Boolean),
      }),
      ...(book.publication_date && {
        releaseDate: book.publication_date,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description: description.substring(0, 160),
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
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

  return (
    <>
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
    </>
  );
}
