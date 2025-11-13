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
    credit?: string   // <- NEW
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
  slug: string;
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
  formatLabel?: string | null;
};

// Links on series docs
export type SeriesLink =
  | { type: 'black_library'; url: string }
  | { type: 'lexicanum'; url: string }
  | { type: 'wikipedia'; url: string }
  | { type: 'goodreads'; url: string }
  | { type: 'amazon'; url: string }
  | { type: 'other'; url: string; label?: string };

// Book shape used in list items
export type SeriesContentItem = {
  work: Book40k; 
};

// Titled list of ordered works
export type SeriesList40k = {
  title: string;
  key?: string | null;               // from slug.current
  description?: string | null; 
  items?: SeriesContentItem[] | null;
};

// Full Series document for app consumption
export type Series40kDoc = {
  _id: string;
  _type: 'series40k';
  title: string;
  slug: string;                      // projected as slug.current
  subtitle?: string | null;
  image?: SanityImageField;
  lists?: SeriesList40k[] | null;
  totalCount?: number;
  links?: SeriesLink[] | null;
};
