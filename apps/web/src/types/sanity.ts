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
