// /app/page.tsx
import Hero from "@/components/modules/Hero";
import BookWall, { type BookWallCover } from "@/components/modules/Hero/BookWall";
import AuthorsCarousel from "@/components/modules/Carousel/AuthorsCarousel";
import BooksCarousel from "@/components/modules/Carousel/BooksCarousel";
import SeriesCarousel from "@/components/modules/Carousel/SeriesCarousel";
import FactionCarousel from "@/components/modules/Carousel/FactionCarousel";
import EraCarousel from "@/components/modules/Carousel/EraCarousel";
import BlogCarousel from "@/components/modules/Carousel/BlogCarousel";

import { client } from "@/lib/sanity/sanity.client";
import {
  blogPostsQuery,
  heroCoversQuery,
  faqCategoriesBySlugsQuery,
  featuredAuthors40kQuery,
  featuredBooks40kQuery,
  featuredSeries40kQuery,
} from "@/lib/sanity/queries";
import type { BlogPost } from "@/types/sanity";

import Search from "@/components/modules/Search";
import { getSearchShortcuts } from "@/lib/searchShortcuts";
import JsonLd from "@/components/seo/JsonLd";
import TrackerPromo from "@/components/modules/TrackerPromo";
import FaqSection from "@/components/modules/FaqSection";
import HomeCta from "@/components/modules/HomeCta";
import type { FaqCategory } from "@/components/modules/FaqList";
import { DEFAULT_TITLE, SITE_DESCRIPTION, pageMetadata, siteJsonLd } from "@/lib/seo";

export const revalidate = 60;

export const metadata = pageMetadata({
  title: DEFAULT_TITLE,
  absoluteTitle: true,
  description: SITE_DESCRIPTION,
  path: "/",
});

// Well-known books for the hero's book wall. Must match titles exactly; titles
// without a cover are skipped.
const heroCoverTitles = [
  "Horus Rising", "False Gods", "Galaxy in Flames", "The Flight of the Eisenstein",
  "Fulgrim", "Descent of Angels", "Legion", "Mechanicum", "A Thousand Sons",
  "Know No Fear", "The First Heretic", "Prospero Burns", "Betrayer",
  "The Outcast Dead", "Angel Exterminatus", "Vulkan Lives", "The Solar War",
  "The Lost and the Damned", "The First Wall", "Warhawk", "Xenos", "Malleus",
  "Hereticus", "Ravenor", "Pariah", "First and Only", "Necropolis",
  "Only in Death", "Ghostmaker", "For the Emperor", "Caves of Ice",
  "Soul Hunter", "Blood Reaver", "Void Stalker", "Ahriman: Exile", "Helsreach",
  "Dark Imperium", "Lord of the Night", "Fifteen Hours", "Double Eagle",
  "Titanicus", "Priests of Mars", "Storm of Iron", "Path of the Warrior",
  "Avenging Son", "Indomitus", "Farsight: Crisis of Faith",
  "Yarrick: Imperial Creed", "Dead Men Walking", "Space Wolf",
  "Brothers of the Snake", "The Talon of Horus", "Black Legion",
  "Lucius: The Faultless Blade", "Belisarius Cawl: The Great Work", "Krieg",
  "Valdor: Birth of the Imperium", "Atlas Infernal", "Dante", "Kingsblade",
];

/** One cover per title, in random order so the wall changes between builds */
function pickHeroCovers(covers: BookWallCover[]) {
  const byTitle = new Map(covers.map((c) => [c.title, c]));
  const unique = [...byTitle.values()];
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique;
}

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
    { next: { revalidate } }
  );

  // Preserve the order from featuredNames
  // The query already returns the count from Sanity
  const featuredAuthors = authors.sort(
    (a: any, b: any) =>
      featuredNames.indexOf(a.name) - featuredNames.indexOf(b.name)
  );

  // The most-read and most-recommended 40k books outside the Horus Heresy
  // (Goodreads ratings, r/40kLore and forum recommendations), mostly series
  // openers so each is a good place to start. Must match titles exactly.
  const featuredTitles = [
    "Xenos",
    "First and Only",
    "For the Emperor",
    "Soul Hunter",
    "Helsreach",
    "The Talon of Horus",
    "Ravenor",
    "Dark Imperium",
    "Space Wolf",
    "Storm of Iron",
  ];

  const featuredBooksRaw = await client.fetch(
    featuredBooks40kQuery,
    { titles: featuredTitles },
    { next: { revalidate } }
  );

  // Preserve order based on featuredTitles
  const featuredBooks = (featuredBooksRaw as any[]).sort(
    (a, b) =>
      featuredTitles.indexOf(a.title) - featuredTitles.indexOf(b.title)
  );

  // Must match titles exactly.
  const featuredSeriesTitles = [
    "Horus Heresy",
    "Inquisitor",
    "Gaunt's Ghosts",
    "Ciaphas Cain",
    "Yarrick",
    "Ultramarines",
    "Night Lords",
    "Ahriman",
  ];

  const featuredSeriesRaw = await client.fetch(
    featuredSeries40kQuery,
    { titles: featuredSeriesTitles },
    { next: { revalidate } }
  );

  // Preserve order based on featuredSeriesTitles
  const featuredSeries = (featuredSeriesRaw as any[]).sort(
    (a, b) =>
      featuredSeriesTitles.indexOf(a.title) - featuredSeriesTitles.indexOf(b.title)
  );

  const posts = await client.fetch<BlogPost[]>(
    blogPostsQuery,
    {},
    { next: { revalidate } }
  );

  const heroCovers = pickHeroCovers(
    await client.fetch<BookWallCover[]>(
      heroCoversQuery,
      { titles: heroCoverTitles },
      { next: { revalidate } }
    )
  );

  const searchShortcuts = await getSearchShortcuts();

  const faqCategories = await client.fetch<FaqCategory[]>(
    faqCategoriesBySlugsQuery,
    { slugs: ["getting-started", "the-archive"] },
    { next: { revalidate } },
  );

  return (
    <main style={{paddingBottom:'0px'}}>
      <JsonLd data={siteJsonLd()} />
      <Hero
        image="/images/black-library-books.jpg"
        background={heroCovers.length > 0 ? <BookWall covers={heroCovers} /> : undefined}
        title={<>Explore the Black Library<sup>™</sup></>}
        subtitle="Browse & track Warhammer 40,000 publications by author, faction, era, and series."
        priority
        align="center"
        height="md"
        scrollCue
      >
        <Search shortcuts={searchShortcuts} />
      </Hero>

      <section className="container row__lg">
        <BooksCarousel
          title="Featured Books"
          subtitle="Popular books from the Black Library"
          books={featuredBooks}
          viewAllLink="/books"
        />
      </section>

      <div className="container row__lg">
        <TrackerPromo />
      </div>

      <section className="container row__lg">
        <AuthorsCarousel
          title="Featured Authors"
          subtitle="Browse the authors of the Black Library"
          authors={featuredAuthors}
        />
      </section>

      <section className="container row__lg">
        <SeriesCarousel
          title="Featured Series"
          subtitle="Follow ongoing sagas and campaigns across the Black Library"
          series={featuredSeries}
        />
      </section>

      <section className="container row__lg">
        <FactionCarousel
          title="Browse by Faction"
          subtitle="Find books on specific armies, legions, chapters, and factions"
          initialGroupKey="space-marines"
          basePath="/factions"
        />
      </section>

      <section className="container row__lg">
        <EraCarousel
          title="Browse by Era"
          subtitle="Find books from specific eras"
          viewAllLink="/eras"
        />
      </section>

      <div className="container row__lg">
        <FaqSection
          categories={faqCategories}
          combined
          subtitle="New to the Archive? Start here."
          viewAllHref="/faq"
          headingId="home-faq"
        />
      </div>

      {posts.length > 0 && (
        <section className="container row__lg">
          <BlogCarousel
            title="Astropathic Relays"
            subtitle="News and updates from the Imperial Archive Blog"
            posts={posts}
          />
        </section>
      )}

      <HomeCta />
    </main>
  );
}