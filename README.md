# The Imperial Archive 

A comprehensive web application for browsing [Games Workshop's Warhammer 40,000](https://www.warhammer.com/) books from the [Black Library](https://www.blacklibrary.com/). Browse the extensive catalog by author, faction, era, and series.

<!-- ![Black Library](https://black-library.vercel.app/images/black-library-books.jpg) -->

Visit the site at [ImperialArchive.com](https://imperialarchive.com)

## 📑 Table of Contents

- [The Imperial Archive](#the-imperial-archive)
  - [📑 Table of Contents](#-table-of-contents)
  - [🚧 Work in Progress](#-work-in-progress)
    - [🎯 Upcoming Features](#-upcoming-features)
  - [❓ Why](#-why)
  - [🎓 Learning Goals \& Technical Challenges](#-learning-goals--technical-challenges)
    - [📊 Data Complexity](#-data-complexity)
    - [💡 Technical Learnings](#-technical-learnings)
  - [⚙️ Tech Stack](#️-tech-stack)
  - [✨ Features](#-features)
  - [🏗️ Architecture](#️-architecture)
    - [📝Content Management](#content-management)
    - [🔍 Search \& Discovery](#-search--discovery)
    - [🖼️ Frontend](#️-frontend)
  - [🔑 Key Integrations](#-key-integrations)
    - [Sanity → Algolia Sync](#sanity--algolia-sync)
    - [🔄 Data Flow](#-data-flow)
  - [🌐 Live Site](#-live-site)
  - [🤖 AI Development Notice](#-ai-development-notice)
  - [📝 License](#-license)

## 🚧 Work in Progress

This project is actively being developed! You can access the site with the password **emperorprotects**

Here's what's currently in the works:

### 🎯 Upcoming Features
- **Enhanced UI/UX** - Continued improvements to the interfacea and user experience for both mobile and desktop devices
- **Advanced Algolia Features** - Including Algolia instantsearch on needed pages
- **User Authentication** - Sign in to access personalized features
- **Personal Library Management** - Track books you've read and own
- **Favorites & Wishlists** - Save books you want to read
- **User Reviews & Ratings** - Share your thoughts on books with the community
- **Real-time Database** - Powered by [Convex](https://www.convex.dev/) for instant synchronization

## ❓ Why

The official [Black Library](https://www.blacklibrary.com/) website and existing third-party Warhammer 40,000 wikis like [Lexicanum](https://lexicanum.com/) and the [Warhammer 40k Wiki](https://warhammer40k.fandom.com/) lack robust search and filtering capabilities, making it difficult to discover books across the extensive catalog. This project was created to provide:

- **Better Search** - Fast, typo-tolerant search powered by Algolia
- **Advanced Filtering** - Filter by multiple criteria simultaneously (author, faction, era, series, format)
- **Complete Catalog** - A comprehensive view of the entire Black Library collection in one place
- **Better Discovery** - Find books by faction, era, or author
- **Modern UX** - A clean, fast interface built with modern web technologies

## 🎓 Learning Goals & Technical Challenges
I started this app to gain deeper experience with **TypeScript**, **Algolia v5**, **Sanity v4**, and **Next.js 15**. I chose to use the Black Library catalog as the dataset because I'm a fan of these books, and the catalog presents several interesting technical challenges that make it ideal for learning:

### 📊 Data Complexity

**1. No Official API**
- Games Workshop does not provide an official API 
- Open APIs (OpenLibrary, Google Books) lack complete Black Library coverage
- No official resource for data like author image/bio and faction svg icon/description

**2. Multi-Format Publications**
- Stories may be released as standalones, and then in Omnibus collections and/or Anthologies

**3. Multiple Content Formats**
- Traditional print (novels, novellas, graphic novels, omnibus, anthologies)
- Stories may be traditional print and/or audio
- Each format has different metadata requirements

**4. Complex Relationships**
- Stories may belong to multiple series simultaneously
- Series can be nested (sub-series within larger series)
- Relationships between books, factions, and eras

**5. Rich Metadata**
- Book meta data (author, descriptions, era, series, included factions, external links)
  - Publication details (ISBNs, page counts, release dates, multiple editions)
- Author metadata (biographies, photos, external links, social profiles)
- Faction metadata (SVG icons, descriptions, color schemes)

### 💡 Technical Learnings

- Complex Sanity schemas with references and conditional fields
- Algolia indexing for nested relationships and faceted search
- Real-time sync using Sanity Functions
- Document size optimization near Algolia's free 10KB limit
- Type-safe TypeScript interfaces mirroring CMS schemas
- Next.js SSR/SSG optimization patterns

## ⚙️ Tech Stack

- **[Next.js](https://nextjs.org/)** - Full-stack React framework with server-side rendering, static generation, and API routes
  - **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript for better developer experience and code quality
  - **[SCSS](https://sass-lang.com/)** - CSS preprocessor with variables, nesting, and mixins
   - **[Swiper](https://swiperjs.com/)** - Touch-enabled carousels and sliders
   - **[dnd kit](https://dndkit.com/)** - Drag and drop toolkit for sortable lists and interactive UI
- **[Sanity CMS](https://www.sanity.io/)** - Headless CMS for content management
- **[Algolia](https://www.algolia.com/)** - Search and discovery API for fast, relevant search and filtering
- **[Convex](https://www.convex.dev/)** - Real-time backend for user data, favorites, and library tracking

## ✨ Features

- **Fast Search** - Powered by Algolia for instant results
- **[Browse all books](https://black-library.vercel.app/books)** - Browse the full catalog of Warhammer 40,000 stories across every age of the Imperium.
- **[Browse by Author](https://black-library.vercel.app/authors)** - Explore books from your favorite Black Library authors
- **[Browse by Faction](https://black-library.vercel.app/factions)** - Find books about specific armies, legions, chapters, and factions
- **[Browse by Era](https://black-library.vercel.app/eras)** - Discover books from different Warhammer 40,000 eras
- **[Browse by Series](https://black-library.vercel.app/eras)** - Follow complete book series in order

## 🏗️ Architecture

### 📝Content Management
The site uses **Sanity CMS** as a headless content management system to manage:
- Book catalog (title, descriptions, publication date, format, editions, series, included factions, external links)
- Author information
- Faction details
- Era classifications
- Series organization

### 🔍 Search & Discovery
**Algolia** powers the search functionality with:
- Real-time indexing via Sanity Functions
- Automatic sync when content is created, updated, or deleted
- Fast, typo-tolerant search
- Faceted filtering by author, faction, era, and format

### 🖼️ Frontend
Built with **Next.js** for:
- Server-side rendering (SSR)
- Static site generation (SSG)
- Optimized image loading
- Fast page transitions
- SEO optimization

## 🔑 Key Integrations

### Sanity → Algolia Sync
The project includes a Sanity Function that automatically syncs book data to Algolia:
- Listens for document create/update/delete events
- Fetches related references (authors, factions, eras, series)
- Formats and indexes data in Algolia
- Handles document size limits and field truncation

### 🔄 Data Flow
```
Sanity CMS → Sanity Function → Algolia Index → Next.js Frontend
```

## 🌐 Live Site

Visit the site at [imperialarchive.com](https://imperialarchive.com)

## 🤖 AI Development Notice

This project was developed with assistance from AI (Claude, ChatGPT) for:
- **Rapid prototyping** - Quickly scaffolding components, boilerplates, and testing ideas
- **Debugging & troubleshooting** - Diagnosing functional and styling issues
- **Documentation** - Helping structure and write this README

**Important:** While AI assisted in development, all AI-generated code is thoroughly reviewed, tested, and refactored to fit the project's specific needs and coding standards. AI serves as a productivity tool, not a replacement for hands-on development and critical thinking.

**Important:** All catalog data is collected via OpenLibrary, GoogleBooks, and/or manually curated and verified. The AI served as a development tool, not a content creator.

## 📝 License

**© Games Workshop** - All Warhammer 40,000 content and imagery is property of Games Workshop.

**Imperial Archive** is an unofficial, fan-made database and reading guide for the Warhammer universe. This site is not affiliated with or endorsed by Games Workshop. All Warhammer® and Warhammer 40,000® trademarks, logos, names, and images are the property of Games Workshop Limited.

---