import { getSanityClient, sanityFetchOptions } from "./client";
import { lastKnownGoodPortfolio } from "./last-known-good";
import { mapSanityProject } from "./map-project";
import { PORTFOLIO_PROJECTS_QUERY } from "./queries";
import type { PortfolioRecord, SanityProjectDocument } from "./types";

export function publishedPortfolioOrFallback(
  mapped: PortfolioRecord[],
  fallback: PortfolioRecord[] = lastKnownGoodPortfolio()
): PortfolioRecord[] {
  return mapped.length > 0 ? mapped : fallback;
}

/**
 * Sanity is the primary Portfolio source.
 * Last-known-good snapshot (or hardcoded demo if no valid snapshot) is used
 * only when the client is unconfigured, the request fails, or zero valid
 * published projects. The two lists are never merged.
 */
export async function getPortfolioProjects(): Promise<PortfolioRecord[]> {
  if (process.env.NODE_ENV !== "production") {
    const { connection } = await import("next/server");
    await connection();
  }

  const fallback = lastKnownGoodPortfolio();
  if (process.env.NODE_ENV !== "production") {
    const { headers } = await import("next/headers");
    const simulate = (await headers()).get("x-dtm-simulate-sanity-failure");
    if (simulate === "1") {
      console.error("[portfolio] simulated Sanity failure; using last-known-good");
      return fallback;
    }
  }

  const client = getSanityClient();
  if (!client) return fallback;

  try {
    const docs = await client.fetch<SanityProjectDocument[]>(
      PORTFOLIO_PROJECTS_QUERY,
      {},
      sanityFetchOptions()
    );
    const mapped = (docs ?? [])
      .map(mapSanityProject)
      .filter((item): item is PortfolioRecord => Boolean(item));
    return publishedPortfolioOrFallback(mapped, fallback);
  } catch (error) {
    console.error("[portfolio] Sanity fetch failed; using last-known-good", error);
    return fallback;
  }
}
