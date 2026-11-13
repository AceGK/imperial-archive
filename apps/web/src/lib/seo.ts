// Shared SEO constants and helpers: page metadata defaults and schema.org
// structured data (JSON-LD) builders.
import type { Metadata } from "next";
import { parseCatalogPage } from "@/lib/algolia/routing";

export const SITE_URL = "https://imperialarchive.com";
export const SITE_NAME = "Imperial Archive";

export const SITE_DESCRIPTION =
  "Imperial Archive is a fan-made catalog and reading tracker for Warhammer 40,000 fiction from Black Library. Browse 40k books, authors, series, factions, and eras, find reading orders, and track what you've read.";

export const SITE_KEYWORDS = [
  "Imperial Archive",
  "Black Library",
  "Black Library books",
  "Warhammer 40k",
  "Warhammer 40,000",
  "Warhammer 40k books",
  "Warhammer 40k reading order",
  "Warhammer reading tracker",
  "Horus Heresy reading order",
  "40k novels",
];

// leads with the reading tracker phrase people search for, and keeps 40k on
// the catalog, which is all 40k for now
export const DEFAULT_TITLE = `${SITE_NAME} | Warhammer Reading Tracker & 40k Book Catalog`;

/** The Archive's profiles on other sites (schema.org sameAs) */
export const SITE_PROFILES = ["https://ko-fi.com/imperialarchive"];

export const DEFAULT_OG_IMAGE = {
  url: "/images/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Imperial Archive: Warhammer 40k book archive",
};

/** Absolute URL for a site path, e.g. absoluteUrl("/books/horus-rising") */
export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

/** Trim text to a search-snippet-friendly length without cutting mid-word */
export function truncate(text: string | null | undefined, max = 160) {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")) || cut}…`;
}

/**
 * Metadata for a page: title, description, canonical URL, and matching
 * Open Graph / Twitter cards. `title` gets the " | Imperial Archive" suffix
 * from the root layout's template; pass `absoluteTitle` to skip it.
 *
 * Next.js replaces (doesn't merge) nested metadata like `openGraph`, so the
 * site-wide Open Graph fields are repeated here rather than inherited.
 */
export function pageMetadata({
  title,
  absoluteTitle = false,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  noindex = false,
  page = 1,
}: {
  title: string;
  /** Catalog page (from `catalogPageParam`); pages after the first get their own title and canonical URL */
  page?: number;
  /** Keep out of search results (e.g. placeholder pages); links are still followed */
  noindex?: boolean;
  absoluteTitle?: boolean;
  description?: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "book" | "profile";
}): Metadata {
  // later catalog pages are their own pages to search engines, not
  // duplicates of page 1, so each names its page and canonicalizes to itself
  if (page > 1) {
    title = `${title} (Page ${page})`;
    path = `${path}?page=${page}`;
  }
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const ogImage = image ? { url: image, alt: imageAlt ?? title } : DEFAULT_OG_IMAGE;
  return {
    // Spelled out in full (with the template restated for child pages) because
    // a layout that sets its own title stops the root title template from
    // reaching the pages under it
    title: { absolute: fullTitle, template: `%s | ${SITE_NAME}` },
    description,
    alternates: { canonical: path },
    ...(noindex && { robots: { index: false, follow: true } }),
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  };
}

/**
 * The catalog page for a page's metadata. Only a bare `?page=N` counts: with a
 * search or filters in the URL it's a filtered view, which keeps the page's
 * normal canonical URL (and robots.txt keeps crawlers off it anyway).
 */
export function catalogPageParam(searchParams: Record<string, string | string[] | undefined>) {
  const keys = Object.keys(searchParams);
  if (keys.length !== 1 || keys[0] !== "page") return 1;
  return parseCatalogPage(searchParams.page);
}

/* ------------------------------------------------------------------
   Structured data (schema.org JSON-LD)
------------------------------------------------------------------- */

type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...crumbs].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export const blackLibraryJsonLd = {
  "@type": "Organization",
  name: "Black Library",
  url: "https://www.blacklibrary.com",
};

const AUDIO_FORMATS = new Set(["audio_drama", "audio_anthology"]);

const nonEmpty = <T,>(list: T[]) => (list.length ? list : undefined);

type BookLike = {
  title: string;
  slug: string;
  formatValue?: string | null;
  format?: string | null;
  description?: string | null;
  story?: string | null;
  publication_date?: string | null;
  page_count?: number | null;
  authors?: { name?: string | null; slug?: string | null }[];
  editions?: { isbn?: string | null }[];
  series?: { name?: string | null; slug?: string | null; number?: number | null }[];
  factions?: { title?: string | null }[];
  era?: { title?: string | null } | null;
};

/** schema.org Book for a book detail page */
export function bookJsonLd(book: BookLike, imageUrl?: string) {
  const isbn = book.editions?.map((e) => e?.isbn).find(Boolean);
  const keywords = [
    ...(book.factions ?? []).map((f) => f?.title),
    book.era?.title,
    "Warhammer 40,000",
    "Black Library",
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": absoluteUrl(`/books/${book.slug}#book`),
    name: book.title,
    url: absoluteUrl(`/books/${book.slug}`),
    description: truncate(book.description || book.story, 500),
    image: imageUrl,
    author: nonEmpty(
      (book.authors ?? [])
        .filter((a) => a?.name)
        .map((a) => ({
          "@type": "Person",
          name: a.name,
          ...(a.slug && { url: absoluteUrl(`/authors/${a.slug}`) }),
        }))
    ),
    publisher: blackLibraryJsonLd,
    datePublished: book.publication_date || undefined,
    numberOfPages: book.page_count || undefined,
    isbn: isbn || undefined,
    bookFormat:
      book.formatValue && AUDIO_FORMATS.has(book.formatValue)
        ? "https://schema.org/AudiobookFormat"
        : book.formatValue === "graphic_novel"
          ? "https://schema.org/GraphicNovel"
          : undefined,
    genre: ["Science fiction", "Military science fiction", book.format].filter(Boolean),
    inLanguage: "en",
    keywords: keywords.join(", "),
    isPartOf: nonEmpty(
      (book.series ?? [])
        .filter((s) => s?.name && s?.slug)
        .map((s) => ({
          "@type": "BookSeries",
          name: s.name,
          url: absoluteUrl(`/series/${s.slug}`),
        }))
    ),
    ...(book.series?.[0]?.number != null && { position: book.series[0].number }),
  };
}

/** Site identity for the home page: drives the site name shown in Google results */
export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: SITE_NAME,
      alternateName: ["ImperialArchive", "Imperial Archive 40k"],
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": absoluteUrl("/#organization") },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/imperial-archive-logo.svg"),
      // the Archive's own profiles elsewhere, so search engines tie them to
      // this site; add social accounts here as they're made
      sameAs: SITE_PROFILES,
    },
  ];
}
