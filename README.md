<h1>The Imperial Archive</h1>
<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Sanity-F03E2F?style=for-the-badge&logo=sanity&logoColor=white" alt="Sanity" />
  <img src="https://img.shields.io/badge/Algolia-5468FF?style=for-the-badge&logo=algolia&logoColor=white" alt="Algolia" />
  <img src="https://img.shields.io/badge/Convex-EE342F?style=for-the-badge&logoColor=white" alt="Convex" />
  <img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" alt="SCSS" />
</p>

A free, fan-made catalog and reading tracker for [Warhammer 40,000](https://www.warhammer.com/) fiction from the [Black Library](https://www.blacklibrary.com/). Browse more than 1,100 novels, novellas, short stories, anthologies and audio dramas by author, series, faction and era, find reading orders, and track what you want to read, are reading, have read and own.

**Live site: [imperialarchive.com](https://imperialarchive.com)**

<h2>Contents</h2>

- [Why](#why)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Component Organization](#component-organization)
  - [Data Flow](#data-flow)
- [Getting Started](#getting-started)
- [Roadmap](#roadmap)
- [Technical Challenges](#technical-challenges)
- [License](#license)

## Why

The official [Black Library](https://www.blacklibrary.com/) website has closed its online catalog, and community wikis like [Lexicanum](https://wh40k.lexicanum.com/) and the [Warhammer 40k Wiki](https://warhammer40k.fandom.com/) are great for lore but weak at search and filtering. Finding books across a catalog this size is hard. Imperial Archive provides:

- **Better search:** fast, typo-tolerant search powered by Algolia
- **Real filtering:** combine author, faction, era, series and format at once
- **The whole catalog in one place:** every format, linked to its authors, series, factions and era
- **Reading orders:** series laid out in order, with "preceded by" and "followed by" links on each book
- **A reading tracker:** a free log of your Black Library reading that follows you across devices

## Features

- **[Books](https://imperialarchive.com/books)**, **[Authors](https://imperialarchive.com/authors)**, **[Series](https://imperialarchive.com/series)**, **[Factions](https://imperialarchive.com/factions)** and **[Eras](https://imperialarchive.com/eras)** catalogs with faceted filters, grid and list views, and per-reader display options (show or hide covers, authors, dates, formats and more)
- **Hero search** across books, authors, series, factions and eras in one list, with authors first
- **[Reading tracker](https://imperialarchive.com/track):** mark any book as Want to read, Reading or Read, and separately as Owned, from a book card or book page; see it all on your account's Track page
- **Accounts:** email and password sign-up with email verification, password reset, favorites for books, series, authors, factions and eras
- **Book pages** with descriptions, back-cover text, series navigation, collected-in links and numbered sources (`[1][2]`) linking to Black Library and Lexicanum
- **Content managed in Sanity:** books and catalog data, FAQs, blog posts, standalone pages (Terms, Privacy) and URL redirects, all live without a redeploy
- **SEO:** per-page metadata, structured data (Book, BookSeries, FAQPage, BreadcrumbList and more), and a full sitemap

## Tech Stack

- **[TypeScript](https://www.typescriptlang.org/)** throughout
- **[Next.js 15](https://nextjs.org/)** (App Router) with server rendering and incremental revalidation
  - **[SCSS modules](https://sass-lang.com/)** with shared mixins; no UI framework, every component is hand-built
  - **[Swiper](https://swiperjs.com/)** for carousels and **[dnd kit](https://dndkit.com/)** for drag-and-drop lists
- **[Sanity](https://www.sanity.io/)** (v4) as the headless CMS, with **Sanity Functions** keeping Algolia in sync
- **[Algolia](https://www.algolia.com/)** (v5) with React InstantSearch for search and faceted filtering
- **[Convex](https://www.convex.dev/)** for user data (favorites, reading tracker) and **[Convex Auth](https://labs.convex.dev/auth)** for accounts
- **[Resend](https://resend.com/)** for account emails (verification and password-reset codes)
- **[Vercel](https://vercel.com/)** for hosting, Web Analytics and Speed Insights

## Architecture

### Project Structure

An npm workspaces monorepo with the website, the CMS studio, and the Sanity Functions that sync content to Algolia:

```
/
├── apps/
│   ├── studio/              # Sanity Studio: schemas, desk structure, one-off scripts
│   └── web/                 # Next.js website
│       ├── convex/          # Convex backend: schema, auth, favorites, tracking, emails
│       └── src/
│           ├── app/         # Routes (App Router)
│           ├── components/
│           │   ├── algolia/ # InstantSearch widgets
│           │   ├── icons/   # SVG icons compiled with SVGR (faction icons, achievements, UI)
│           │   ├── layouts/ # Reusable page layouts
│           │   ├── modules/ # Composite, feature-level components
│           │   └── ui/      # Atomic building blocks (Button, Accordion, RichText…)
│           ├── lib/         # Sanity client and queries, Algolia client, SEO helpers
│           └── styles/      # Global styles, breakpoints and mixins
├── functions/               # Sanity Functions: sync books, authors and series to Algolia
└── sanity.blueprint.ts      # Deploys the Sanity Functions
```

### Component Organization

- **`/algolia`:** search UI components that integrate with Algolia's API
- **`/icons`:** faction icons, achievement icons, UI icons and custom SVG components
- **`/layouts`:** page-level layout wrappers and structural templates
- **`/modules`:** feature-rich components built from smaller pieces
- **`/ui`:** simple, reusable building blocks following atomic design principles

### Data Flow

```
Sanity Studio ──publish──> Sanity Function ──> Algolia indexes ──> catalogs and search
      │
      └──────────── GROQ queries ─────────────────────────────> book, series and info pages

Browser ──> Convex (auth, favorites, reading tracker)
```

- **Catalog content** lives in Sanity. Publishing a book, author or series triggers a Sanity Function that formats it (resolving references, trimming fields to Algolia's size limits) and updates the matching Algolia index.
- **Catalog pages** query Algolia through a cached `/api/search` proxy; detail pages query Sanity directly and revalidate every 60 seconds.
- **User data** (accounts, favorites, tracked books) lives in Convex and updates live, with optimistic updates in the UI.

## Getting Started

Requires **Node 22 or newer** and npm 10+.

```sh
npm install          # from the repo root; installs both apps
npm run dev          # runs the website (localhost:3000) and the studio (localhost:3333)
```

The website also needs the Convex dev backend. Run it from **`apps/web`**, not the repo root:

```sh
cd apps/web
npx convex dev
```

Each app reads its credentials (Sanity, Algolia, Convex) from its own `.env.local`, which isn't committed. Convex keeps its auth and email settings on the deployment itself.

### Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Website and studio together |
| `npm run dev:web` / `npm run dev:studio` | One app only |
| `npm run build` | Production builds of both apps |
| `npm run typecheck` | Type-check every workspace |
| `npx sanity deploy` (in `apps/studio`) | Deploy the studio |
| `npx convex deploy` (in `apps/web`) | Deploy Convex functions to production |

## Roadmap

The project is in active development. Next up:

- **Reading progress:** series, era, faction and author progress, reading stats and achievements
- **Reviews and ratings**, and display names for reader profiles
- **Sign in with Google, GitHub and Discord** (built, waiting on provider setup)
- **Characters** catalog
- **Catalog completeness:** ongoing manual curation to fill gaps, with community submissions later

## Technical Challenges

The Black Library catalog makes for an interesting data problem:

- **No official API.** Games Workshop doesn't offer one, and open book APIs (OpenLibrary, Google Books) have patchy coverage, thin descriptions and low-resolution covers, so the catalog is curated by hand in Sanity.
- **Stories are published many ways.** A story may appear on its own, then in an anthology and an omnibus, in print and audio, so books link to the collections that contain them.
- **Many-to-many relationships.** Books belong to several series at once, series contain ordered lists, and books feature multiple factions and an era.
- **Search on a budget.** Algolia records stay under the free plan's 10KB limit, typed search only, and small collections (factions, eras, authors, series) are matched in the browser instead of costing Algolia searches.
- **Hand-built UI.** No component library: accessible menus, accordions, carousels and dialogs written from scratch with SCSS modules.

## License

Copyright © 2025-2026 Imperial Archive. All rights reserved. The source code is public so you can read it, but it isn't licensed for reuse; see [LICENSE](LICENSE).

**Imperial Archive** is an unofficial, fan-made database and reading guide for the Warhammer universe. It is not affiliated with or endorsed by Games Workshop. All Warhammer® and Warhammer 40,000® trademarks, logos, names, and images are the property of Games Workshop Limited. Book descriptions are quoted from their publishers and other sources and remain the work of their respective authors and publishers. Faction icons are from [wh40k-icon](https://github.com/Certseeds/wh40k-icon); see the [About page](https://imperialarchive.com/about#attribution) for full credits.
