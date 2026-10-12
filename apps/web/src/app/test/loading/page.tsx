import Link from "next/link";
import type { GridVariant } from "@/components/modules/Catalog";
import CatalogSkeleton from "@/components/modules/Catalog/Skeleton";
import { FilterButtonSkeleton } from "@/components/algolia/RefinementList/FilterButtonSkeleton";
import { StatsPlaceholder } from "@/components/algolia/Stats/StatsPlaceholder";
import MagnifyingGlass from "@/components/icons/magnifying-glass.svg";
import SortIcon from "@/components/icons/sort.svg";
import ChevronDown from "@/components/icons/chevron-down.svg";
import catalogStyles from "@/components/modules/Catalog/styles.module.scss";
import searchStyles from "@/components/algolia/SearchBox/styles.module.scss";
import sortStyles from "@/components/algolia/SortBy/styles.module.scss";

// The catalogs as configured on their pages: filters, sort default, card type
const CATALOGS: {
  title: string;
  href: string;
  variant: GridVariant;
  filters: string[];
  sort: string;
  count: number;
}[] = [
  {
    title: "Books",
    href: "/books",
    variant: "book",
    filters: ["Format", "Author", "Series", "Faction", "Era"],
    sort: "Most Recent",
    count: 10,
  },
  {
    title: "Authors",
    href: "/authors",
    variant: "author",
    filters: ["Format", "Series", "Faction", "Era"],
    sort: "Name A-Z",
    count: 8,
  },
  {
    title: "Series",
    href: "/series",
    variant: "series",
    filters: ["Format", "Author", "Faction", "Era"],
    sort: "Title A-Z",
    count: 8,
  },
];

export default function LoadingStatesTestPage() {
  return (
    <main>
      <div className="container" style={{ paddingBlock: "2rem" }}>
        <h1>Catalog loading states</h1>
        <p style={{ maxWidth: "65ch" }}>
          What each catalog shows while its first search results are on their way: placeholder
          filter buttons, a placeholder count, and skeleton cards. On the real pages these only
          appear when arriving through a link, since full page loads arrive with results already
          rendered. To see them live, throttle the network in your browser&apos;s dev tools and open
          a catalog from the nav.
        </p>
      </div>

      {CATALOGS.map((catalog) => (
        <section key={catalog.title} style={{ paddingBottom: "4rem" }}>
          <div className="container" style={{ paddingBottom: "0.75rem" }}>
            <h2 style={{ margin: 0 }}>
              {catalog.title}{" "}
              <Link href={catalog.href} style={{ fontSize: "0.9rem", fontWeight: 400 }}>
                (open {catalog.href})
              </Link>
            </h2>
          </div>

          {/* the controls bar: search and sort don't wait on results, filters do */}
          <div style={{ borderBlock: "1px solid var(--border)", padding: "1rem 0" }}>
            <div className="container">
              <div className={catalogStyles.controlsInner}>
                <div className={searchStyles.searchBox}>
                  <span className={searchStyles.searchButton} aria-hidden="true">
                    <MagnifyingGlass />
                  </span>
                </div>
                <div className={catalogStyles.desktopFilters}>
                  {catalog.filters.map((filter) => (
                    <FilterButtonSkeleton key={filter} title={filter} />
                  ))}
                </div>
                <div className={sortStyles.sortBy}>
                  <span className={sortStyles.sortButton} aria-hidden="true">
                    <SortIcon className={sortStyles.sortIcon} />
                    <span className={sortStyles.labelFull}>{catalog.sort}</span>
                    <span className={sortStyles.labelShort}>Sort</span>
                    <ChevronDown className={sortStyles.chevron} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="container" style={{ paddingTop: "2rem" }}>
            <StatsPlaceholder />
            <CatalogSkeleton variant={catalog.variant} count={catalog.count} />
          </div>
        </section>
      ))}
    </main>
  );
}
