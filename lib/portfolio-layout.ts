import type { Project } from "@/data/projects";
import { parseSpan } from "@/lib/sanity/map-project";

export type PortfolioSpan = Project["span"];

/** Schema `initialValue` / mapper fallback when Sanity `span` is missing or invalid. */
export const PORTFOLIO_CARD_SIZE_DEFAULT: PortfolioSpan = "small";

/**
 * Desktop flex-basis for each CMS card size.
 * Keep in sync with `.project-slide[data-span]` in `app/globals.css`.
 */
export const PORTFOLIO_CARD_SIZE_TOKENS: Record<
  PortfolioSpan,
  { dataSpan: PortfolioSpan; desktopFlexBasis: string }
> = {
  large: { dataSpan: "large", desktopFlexBasis: "min(36vw, 32rem)" },
  wide: { dataSpan: "wide", desktopFlexBasis: "min(33vw, 29rem)" },
  tall: { dataSpan: "tall", desktopFlexBasis: "min(27vw, 23.5rem)" },
  small: { dataSpan: "small", desktopFlexBasis: "min(23vw, 20rem)" },
};

/**
 * Visual size of a Portfolio card. Sanity `span` ("Розмір картки") is
 * the source of truth. Index-based composition is not applied.
 */
export function portfolioCardSize(
  storedSpan?: string | null
): PortfolioSpan {
  return parseSpan(storedSpan) ?? PORTFOLIO_CARD_SIZE_DEFAULT;
}

export function portfolioCardLayout(storedSpan?: string | null): {
  span: PortfolioSpan;
  dataSpan: PortfolioSpan;
  desktopFlexBasis: string;
} {
  const span = portfolioCardSize(storedSpan);
  return {
    span,
    dataSpan: PORTFOLIO_CARD_SIZE_TOKENS[span].dataSpan,
    desktopFlexBasis: PORTFOLIO_CARD_SIZE_TOKENS[span].desktopFlexBasis,
  };
}
