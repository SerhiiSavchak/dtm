/** Next.js Data Cache tags for published Sanity domains. */
export const SANITY_CACHE_TAGS = {
  portfolio: "sanity-portfolio",
  inProgress: "sanity-in-progress",
} as const;

export type SanityCacheTag =
  (typeof SANITY_CACHE_TAGS)[keyof typeof SANITY_CACHE_TAGS];

export const SANITY_ISR_SECONDS = 60;

export const PORTFOLIO_DOCUMENT_TYPES = new Set(["project", "projectMedia"]);
export const IN_PROGRESS_DOCUMENT_TYPES = new Set([
  "inProgressFrame",
  "inProgressBoard",
]);
