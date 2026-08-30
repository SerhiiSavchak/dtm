import type { Project } from "@/data/projects";

export type PortfolioSpan = Project["span"];

/**
 * Irregular editorial sequence after the lead card.
 * Length 13 — long enough that a 4-item cycle is not obvious,
 * short enough to remain memorable as a composition.
 */
const AFTER_LEAD: readonly PortfolioSpan[] = [
  "tall",
  "wide",
  "small",
  "wide",
  "tall",
  "small",
  "large",
  "tall",
  "wide",
  "small",
  "tall",
  "large",
  "wide",
];

/**
 * Card geometry for the public portfolio track.
 * Index 0 is always the lead statement (`large`).
 * Stored Sanity `span` is ignored unless `useStoredOverride` is set.
 */
export function editorialCardSpan(
  index: number,
  storedSpan?: PortfolioSpan | null,
  options?: { useStoredOverride?: boolean }
): PortfolioSpan {
  if (options?.useStoredOverride && storedSpan) {
    return storedSpan;
  }
  if (index <= 0) return "large";
  return AFTER_LEAD[(index - 1) % AFTER_LEAD.length] ?? "wide";
}

export function editorialCardSpans(count: number): PortfolioSpan[] {
  const n = Math.max(0, Math.floor(count));
  return Array.from({ length: n }, (_, index) => editorialCardSpan(index));
}
