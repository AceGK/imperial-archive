// lib/links.ts

/**
 * The rel for every link that leaves the site:
 * - nofollow: search engines pass no ranking credit to the other site
 * - noopener: the opened tab can't reach back into this one
 * - noreferrer: the other site isn't told the visit came from here
 */
export const EXTERNAL_REL = "nofollow noopener noreferrer";
