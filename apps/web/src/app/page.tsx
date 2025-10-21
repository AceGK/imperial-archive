import Hero from "@/components/modules/Hero";
import AuthorsCarousel from "@/components/modules/Carousel/AuthorsCarousel";
import BooksCarousel from "@/components/modules/Carousel/BooksCarousel";
import FactionCarousel from "@/components/modules/Carousel/FactionCarousel";
import EraCarousel from "@/components/modules/Carousel/EraCarousel";

import { getAuthorsByNames } from "@/lib/40k-authors";
import { getBooksByAuthor, getAllBooks } from "@/lib/40k-books";

export default function Home() {
  // === Featured authors ===
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

  const authors = getAuthorsByNames(featuredNames)
    .map((a) => ({
      ...a,
      count: getBooksByAuthor(a.name)?.length ?? 0,
    }))
    .sort(
      (a, b) => featuredNames.indexOf(a.name) - featuredNames.indexOf(b.name)
    );

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
      />

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
          authors={authors}
        />
      </section>

      <section className="container">
        <FactionCarousel
          title="Browse by Faction"
          subtitle="Find books on specific armies, legions, chapters, and factions"
          initialGroupKey="space-marines" // optional
          basePath="/factions" // routes to /factions/[group]/[slug]
        />
      </section>

      <section className="container">
        <EraCarousel
          title="Browse by Era"
          subtitle="Find books from specific eras"
          // eras={featuredBooks}
          viewAllLink="/eras"
        />
      </section>
    </main>
  );
}
