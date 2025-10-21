// src/lib/40k-authors.ts

import fs from "node:fs";
import path from "node:path";

export type AuthorLink = {
  type:
    | "website"
    | "black_library"
    | "lexicanum"
    | "wikipedia"
    | "x"
    | "facebook"
    | "instagram"
    | (string & {});
  url: string | null;
};

export type AuthorProfile = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  bio: string | null;
  links?: AuthorLink[];
};

const AUTHORS_FILE = path.join(process.cwd(), "data", "40k-authors.json");

export function loadAuthorProfiles(): AuthorProfile[] {
  try {
    if (!fs.existsSync(AUTHORS_FILE)) return [];
    const raw = fs.readFileSync(AUTHORS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image_url: p.image_url ?? null,
      bio: p.bio ?? null,
      links: Array.isArray(p.links) ? p.links.filter(Boolean) : [],
    })) as AuthorProfile[];
  } catch {
    return [];
  }
}

export function getAuthorBySlug(slug: string): AuthorProfile | null {
  return loadAuthorProfiles().find((p) => p.slug === slug) ?? null;
}

export function getAllAuthorSlugs(): string[] {
  return loadAuthorProfiles().map((p) => p.slug);
}

// ⬇️ NEW helper
export function getAuthorsByNames(names: string[]): AuthorProfile[] {
  const all = loadAuthorProfiles();
  const lowerNames = names.map((n) => n.toLowerCase());
  return all.filter((a) => lowerNames.includes(a.name.toLowerCase()));
}
