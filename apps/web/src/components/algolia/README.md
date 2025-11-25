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