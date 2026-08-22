import { projects as hardcodedProjects } from "@/data/projects";
import { getSanityClient, sanityFetchOptions } from "./client";
import {
  hardcodedToRecord,
  mapSanityProject,
} from "./map-project";
import { PORTFOLIO_PROJECTS_QUERY } from "./queries";
import type { PortfolioRecord, SanityProjectDocument } from "./types";

const hardcodedRecords = hardcodedProjects.map(hardcodedToRecord);

/**
 * Sanity is the primary Portfolio source.
 * Hardcoded `data/projects.ts` is used only when the client is unconfigured,
 * the request fails, or the dataset has zero valid published projects.
 * The two lists are never merged.
 */
export async function getPortfolioProjects(): Promise<PortfolioRecord[]> {
  if (process.env.NODE_ENV !== "production") {
    const { connection } = await import("next/server");
    await connection();
  }

  const client = getSanityClient();
  if (!client) return hardcodedRecords;

  try {
    const docs = await client.fetch<SanityProjectDocument[]>(
      PORTFOLIO_PROJECTS_QUERY,
      {},
      sanityFetchOptions()
    );
    const mapped = (docs ?? [])
      .map(mapSanityProject)
      .filter((item): item is PortfolioRecord => Boolean(item));
    if (mapped.length === 0) return hardcodedRecords;
    return mapped;
  } catch (error) {
    console.error("[portfolio] Sanity fetch failed; using hardcoded projects", error);
    return hardcodedRecords;
  }
}
