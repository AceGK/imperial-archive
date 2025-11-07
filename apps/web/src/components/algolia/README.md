# Reusable Algolia Components

This directory contains reusable components for Algolia InstantSearch that can be used across different indices (books, authors, factions, series, etc.).

## Components

### SearchBox
A debounced search input component.

```tsx
import { SearchBox } from "@/components/algolia";

<SearchBox 
  placeholder="Search books..." 
  debounceMs={300} 
/>
```

### Stats
Displays the number of search results.

```tsx
import { Stats } from "@/components/algolia";

<Stats 
  singularLabel="book" 
  pluralLabel="books" 
/>
```

### Pagination
Responsive pagination with mobile/desktop variations.

```tsx
import { Pagination } from "@/components/algolia";

<Pagination 
  maxPagesDesktop={7} 
  maxPagesMobile={3} 
/>
```

### SortBy
Dropdown for sorting results.

```tsx
import { SortBy } from "@/components/algolia";

const sortOptions = [
  { label: "Most Recent", value: "books40k" },
  { label: "Title A-Z", value: "books40k_title_asc" },
];

<SortBy 
  items={sortOptions}
  label="Sort by:"
  showLabel={true}
/>
```

### RefinementList
Individual filter dropdown for desktop (faceted search).

```tsx
import { RefinementList } from "@/components/algolia";

<RefinementList
  attribute="format"
  title="Format"
  searchable={false}
  limit={20}
  showMore={false}
/>

<RefinementList
  attribute="authors.name"
  title="Author"
  searchable={true}
  limit={100}
  showMore={true}
  showMoreLimit={200}
/>
```

### MobileFilterModal
Full-screen mobile filter modal with multiple sections.

```tsx
import { MobileFilterModal, type FilterSection } from "@/components/algolia";
import { useRefinementList } from "react-instantsearch";

function MyFilters() {
  const formatFilter = useRefinementList({ attribute: "format" });
  const authorFilter = useRefinementList({ attribute: "authors.name" });

  const sections: FilterSection[] = [
    {
      label: "Format",
      items: formatFilter.items,
      refine: formatFilter.refine,
      searchable: false,
    },
    {
      label: "Author",
      items: authorFilter.items,
      refine: authorFilter.refine,
      searchable: true,
    },
  ];

  const hasActiveFilters = 
    formatFilter.items.some(item => item.isRefined) ||
    authorFilter.items.some(item => item.isRefined);

  return (
    <MobileFilterModal
      sections={sections}
      hasActiveFilters={hasActiveFilters}
      buttonLabel="Filters"
    />
  );
}
```

## Example: Full Implementation

See `app/books/BooksContent.tsx` for a complete example using all components together.

## Creating New Index Pages

When creating a new index page (e.g., authors, series, factions):

1. Set up InstantSearchNext wrapper
2. Import the components you need
3. Create your custom hit transformation (like `convertToBookCardData`)
4. Use the reusable components with your specific attributes

Example for an Authors page:

```tsx
import { 
  SearchBox, 
  Stats, 
  Pagination, 
  SortBy, 
  RefinementList 
} from "@/components/algolia";

export default function AuthorsContent() {
  return (
    <InstantSearchNext indexName="authors40k" searchClient={searchClient}>
      <Configure hitsPerPage={25} />
      
      <SearchBox placeholder="Search authors..." />
      
      <RefinementList attribute="faction" title="Faction" />
      
      <Stats singularLabel="author" pluralLabel="authors" />
      
      {/* Your custom Results component */}
      <AuthorResults />
      
      <Pagination />
    </InstantSearchNext>
  );
}
```

## Benefits

- ✅ **DRY**: Write once, use everywhere
- ✅ **Consistent**: Same UX across all search pages
- ✅ **Maintainable**: Fix bugs in one place
- ✅ **Flexible**: Each component accepts props for customization
- ✅ **Typed**: Full TypeScript support
- ✅ **Responsive**: Mobile/desktop handled automatically