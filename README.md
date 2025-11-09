# The Imperial Archive 
## Black Library Explorer

A comprehensive web application for browsing and exploring Warhammer 40,000 books from the Black Library. Browse the extensive catalog by author, faction, era, and series.

![Black Library](https://black-library.vercel.app/images/black-library-books.jpg)

## 🤔 Why This Project?

The official Black Library website and existing third-party Warhammer 40,000 book sites lack robust search and filtering capabilities, making it difficult to discover books across the extensive catalog. This project was created to provide:

- **Better Search** - Fast, typo-tolerant search powered by Algolia
- **Advanced Filtering** - Filter by multiple criteria simultaneously (author, faction, era, series, format)
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

Visit the site at [black-library.vercel.app](https://black-library.vercel.app)

## 📝 License

© Games Workshop - All Warhammer 40,000 content and imagery is property of Games Workshop.


---


# Notes

## additional resources 
- horus heresy reading order https://www.heresyomnibus.com/
- 40k icons https://certseeds.github.io/wh40k-icon/
- https://www.trackofwords.com/2021/02/14/a-guide-to-dan-abnetts-inquisition-series/

- https://wh40k.lexicanum.com/wiki/List_of_Novels
- https://wh40k.lexicanum.com/wiki/Portal:Publications


- unique structure: https://wh40k.lexicanum.com/wiki/The_Sabbat_Worlds_Crusade_(Background_Book)
  
- missing: 
  - https://www.blacklibrary.com/warhammer-horror/WH-Quick-Reads
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/death-warrant-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/death-warrant-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/dark-son-eshort.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/the-reaping-time-ebook.html
  - https://wh40k.lexicanum.com/wiki/Salvation_(Short_Story)
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/the-kauyon-eshort.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/the-tauva-eshort.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/the-greater-evil-eshort.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/aunshi-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/the-patient-hunter-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/sanctuary-of-wyrms-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/out-caste-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/novels/the-chapters-due-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/reflection-in-blood-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/blood-of-sanguinius-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/honour-and-wrath-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/eternal-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/binding-ebook.html
  - https://www.blacklibrary.com/warhammer-40000/quick-reads/born-to-us-ebook.html


  - Pestilence by Dan Abnett
  - Deathwing by Bryan Ansell and William King
  - Lacrymata by Storm Constantine
  - Devil's Marauders by William King
  - Seed of Doubt by Neil McIntosh
  - Unforgiven by Graham McNeill
  - Monastery of Death by Charles Stross
  - Suffer Not The Unclean To Live by Gav Thorpe
  - The Alien Beast Within by Ian Watson
  - Warped Stars by Ian Watson

## missing series? 
- The Uriel Ventris Chronicles:An Ultramarines omnibus
- There Is Only War (anthology)
- Sons of Corax (anthology)