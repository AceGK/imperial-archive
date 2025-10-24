// /app/page.tsx
import Hero from "@/components/modules/Hero";
import AuthorsCarousel from "@/components/modules/Carousel/AuthorsCarousel";
import BooksCarousel from "@/components/modules/Carousel/BooksCarousel";
import FactionCarousel from "@/components/modules/Carousel/FactionCarousel";
import EraCarousel from "@/components/modules/Carousel/EraCarousel";

import { client } from "@/lib/sanity/sanity.client";
import { featuredAuthors40kQuery } from "@/lib/sanity/queries";

// todo replace when books are migrated to Sanity
import { getAllBooks } from "@/lib/40k-books";
import { getBooksByAuthor } from "@/lib/40k-books";
import Search from "@/components/modules/Search";

export const revalidate = 60;

export default async function Home() {
  const featuredNames = [
    "Dan Abnett",
    "Aaron Dembski-Bowden",
    "Graham McNeill",
    "Chris Wraight",
    "Guy Haley",
    "John French",
    "David Annandale",
    "Sandy Mitchell",
    "James Swallow",
    "Ben Counter",
    "Nick Kyme",
    "Mike Brooks",
    "Andy Clark",
  ];

  const authors = await client.fetch(
    featuredAuthors40kQuery,
    { names: featuredNames },
    { cache: "force-cache", next: { revalidate } }
  );

  // Keep the original order defined in featuredNames + add book counts (todo switch to sanity when migrated)
  const featuredAuthors = authors
   .map((a: any) => ({
    ...a,
    count: getBooksByAuthor(a.name)?.length ?? 0,
  }))
    .sort(
      (a: any, b: any) =>
        featuredNames.indexOf(a.name) - featuredNames.indexOf(b.name)
    );

  // Books (todo switch to sanity when migrated)
  const allBooks = getAllBooks();
  const featuredBooks = allBooks.slice(0, 9);

  return (
    <main>
      <Hero
        image="/images/black-library-books.jpg"
        title="Explore the Black Library"
        subtitle="Browse Warhammer 40,000 books by author, faction, era, and series."
        priority
        align="center"
        height="md"
      >
          <Search
          books={allBooks as any}
          placeholder="Search the Archive..."
        />
        </Hero>

      <section className="container">
        <BooksCarousel
          title="Featured Books"
          subtitle="A glimpse into the Black Library archives"
          books={featuredBooks}
          viewAllLink="/books"
        />
      </section>

      <section className="container">
        <AuthorsCarousel
          title="Featured Authors"
          subtitle="Browse the authors of the Black Library"
          authors={featuredAuthors}
        />
      </section>

      <section className="container">
        <FactionCarousel
          title="Browse by Faction"
          subtitle="Find books on specific armies, legions, chapters, and factions"
          initialGroupKey="space-marines"
          basePath="/factions"
        />
      </section>

      <section className="container">
        <EraCarousel
          title="Browse by Era"
          subtitle="Find books from specific eras"
          viewAllLink="/eras"
        />
      </section>
    </main>
  );
}
