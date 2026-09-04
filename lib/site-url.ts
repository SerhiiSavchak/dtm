/** Public canonical origin for metadata, sitemap, and robots. */
export const CANONICAL_SITE_ORIGIN = "https://www.dtm.lviv.ua";

export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return fromEnv || CANONICAL_SITE_ORIGIN;
}
