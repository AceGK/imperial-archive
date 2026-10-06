/**
 * True only for the live production deployment on Vercel.
 * Preview deployments, custom environments (e.g. dev.imperialarchive.com) and
 * local dev are all non-production: hidden from search engines and should not
 * load analytics.
 *
 * Server-side only — VERCEL_ENV isn't exposed to the browser. For client code
 * (e.g. an analytics component) use NEXT_PUBLIC_VERCEL_ENV, which Vercel sets
 * when "Automatically expose System Environment Variables" is on.
 */
export const isProduction = process.env.VERCEL_ENV === "production";
