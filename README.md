# The Imperial Archive 

A comprehensive web application for browsing [Games Workshop's Warhammer 40,000](https://www.warhammer.com/) books from the [Black Library](https://www.blacklibrary.com/). Browse the extensive catalog by author, faction, era, and series.

<!-- ![Black Library](https://black-library.vercel.app/images/black-library-books.jpg) -->

Visit the site at [ImperialArchive.com](https://imperialarchive.com)

## 🚧 Work in Progress

This project is actively being developed! You can access the site with the password **emperorprotects**



Here's what's currently in the works:

### Upcoming Features
- **Enhanced UI/UX** - Continued improvements to the interface and user experience
- **Advanced Algolia Features** - Including Algolia instantsearch on needed pages
- **User Authentication** - Sign in to access personalized features
- **Personal Library Management** - Track books you've read and own
- **Favorites & Wishlists** - Save books you want to read
- **User Reviews & Ratings** - Share your thoughts on books with the community
- **Real-time Database** - Powered by [Convex](https://www.convex.dev/) for instant synchronization


## ❓ Why?

The official [Black Library](https://www.blacklibrary.com/) website and existing third-party Warhammer 40,000 book sites like [Lexicanum](https://lexicanum.com/) and the [Warhammer 40k Wiki](https://warhammer40k.fandom.com/) lack robust search and filtering capabilities, making it difficult to discover books across the extensive catalog. This project was created to provide:


- **Better Search** - Fast, typo-tolerant search powered by Algolia
- **Advanced Filtering** - Filter by multiple criteria simultaneously (author, faction, era, series, format, etc)
- **Complete Catalog** - A comprehensive view of the entire Black Library collection in one place
- **Better Discovery** - Find books by the factions you play, eras you're interested in, or authors you love
- **Modern UX** - A clean, fast interface built with modern web technologies

## 🚀 Tech Stack

- **[Next.js](https://nextjs.org/)** - React framework for production
- **[Sanity CMS](https://www.sanity.io/)** - Headless CMS for content management
- **[Algolia](https://www.algolia.com/)** - Search and discovery API for fast, relevant search

## ✨ Features

- **Fast Search** - Powered by Algolia for instant results
- **[Browse all books](https://black-library.vercel.app/books)** - Browse the full catalog of Warhammer 40,000 stories across every age of the Imperium.
- **[Browse by Author](https://black-library.vercel.app/authors)** - Explore books from your favorite Black Library authors
- **[Browse by Faction](https://black-library.vercel.app/factions)** - Find books about specific armies, legions, chapters, and factions
- **[Browse by Era](https://black-library.vercel.app/eras)** - Discover books from different Warhammer 40,000 eras
- **[Browse by Series](https://black-library.vercel.app/eras)** - Follow complete book series in order

## 🏗️ Architecture

### Content Management
The site uses **Sanity CMS** as a headless content management system to manage:
- Book catalog (title, descriptions, publication date, format, editions, series, included factions, external links)
- Author information
- Faction details
- Era classifications
- Series organization

### Search & Discovery
**Algolia** powers the search functionality with:
- Real-time indexing via Sanity Functions
- Automatic sync when content is created, updated, or deleted
- Fast, typo-tolerant search
- Faceted filtering by author, faction, era, and format

### Frontend
Built with **Next.js** for:
- Server-side rendering (SSR)
- Static site generation (SSG)
- Optimized image loading
- Fast page transitions
- SEO optimization

## 📦 Key Integrations

### Sanity → Algolia Sync
The project includes a Sanity Function that automatically syncs book data to Algolia:
- Listens for document create/update/delete events
- Fetches related references (authors, factions, eras, series)
- Formats and indexes data in Algolia
- Handles document size limits and field truncation

### Data Flow
```
Sanity CMS → Sanity Function → Algolia Index → Next.js Frontend
```

## 🌐 Live Site

Visit the site at [imperialarchive.com](https://imperialarchive.com)

## 📝 License

© Games Workshop - All Warhammer 40,000 content and imagery is property of Games Workshop.


---