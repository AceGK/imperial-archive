// /apps/web/types/sanity.ts

export type Author40k = {
  _id: string
  name: string
  slug: string
  image?: any
  bio?: any[]
  links?: {type: string; url: string}[]
}

export type FactionLink =
  | { type: 'black_library'; url: string }
  | { type: 'lexicanum'; url: string }
  | { type: 'wikipedia'; url: string }

export type FactionGroup40k = {
  _id: string
  title: string
  slug: string
  iconId?: string
  description?: string
  links?: FactionLink[]
  order?: number
}

export type Faction40k = {
  _id: string
  title: string
  slug: string
  iconId?: string
  description?: string
  links?: FactionLink[]
  // denormalized helpers (when you project them)
  groupKey?: string
  groupTitle?: string
  group?: Pick<FactionGroup40k, '_id' | 'title' | 'slug' | 'iconId'>
}

export type FactionGroupWithItems = FactionGroup40k & {
  items: Array<Pick<Faction40k, '_id' | 'title' | 'slug' | 'iconId' | 'description' | 'links'>>
}

export type FactionGroupRef = {
  title: string;
  slug: string;
  iconId?: string;
  links?: FactionLink[];
};

export type Faction40kDoc = {
  _id: string;
  title: string;
  slug: string;
  iconId?: string;
  description?: string;
  links?: FactionLink[];
  group: FactionGroupRef;
};

export type Era40k = {
  _id: string
  title: string
  slug: string
  period?: string
  image?: {
    url: string
    lqip?: string
    aspect?: number
    alt?: string
  }
  description?: string
}

export type SanityImageAsset = {
  _id: string;
  url: string;
  metadata?: {
    dimensions?: { width?: number; height?: number };
    lqip?: string;
  };
};

export type SanityImageField =
  | {
      alt?: string | null;
      credit?: string | null;
      asset?: SanityImageAsset | null;
    }
  | null
  | undefined;

export type Series40k = {
  name: string;
  number?: number | null;
};

export type Book40k = {
  _id: string;
  title: string;
  slug: string;
  author?: string[];
  authorLabel?: string;
  series?: Series40k[];
  publication_date?: string | null;
  factions?: string[];
  image?: SanityImageField;
  description?: string | null;
  story?: string | null;
  format?: string | null;
};


// ---- Series (documents) ----

// Links used on series docs (mirror your `seriesLink` schema)
export type SeriesLink =
  | { type: 'black_library'; url: string }
  | { type: 'lexicanum'; url: string }
  | { type: 'wikipedia'; url: string }
  | { type: 'goodreads'; url: string }
  | { type: 'amazon'; url: string }
  | { type: 'other'; url: string; label?: string };

// Minimal book shape embedded inside a series list item
export type SeriesBookRefLite = Pick<Book40k, '_id' | 'title' | 'slug' | 'image'>;

// One ordered entry inside a reading list
export type SeriesItem40k = {
  number?: number | null;     // simple integer if available
  label?: string | null;      // e.g., "0.5", "Prologue"
  note?: string | null;       // editor guidance
  book: SeriesBookRefLite;    // dereferenced reference
};

// One titled reading list (e.g., "Novels", "Short Stories", subseries, etc.)
export type SeriesList40k = {
  title: string;
  key?: string | null;           // from slug.current
  description?: string | null;
  items?: SeriesItem40k[] | null;
};

// Full Series document projection
export type Series40kDoc = {
  _id: string;
  _type: 'series40k';
  title: string;
  slug: string;                  // projected as slug.current
  description?: string | null;
  image?: SanityImageField;      // matches your global image shape
  lists?: SeriesList40k[] | null;
  totalCount?: number;           // optional convenience from GROQ: count(lists[].items[])
  links?: SeriesLink[] | null;

  // Back-compat: if some docs still have the old single "items" array,
  // keep this optional so UI can render during migration.
  items?: SeriesItem40k[] | null;
};

export type Series40kDocList = Series40kDoc[];