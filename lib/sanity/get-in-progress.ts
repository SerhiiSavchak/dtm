import { getSanityClient, sanityFetchOptions } from "./client";
import {
  assembleInProgressRecord,
  hardcodedInProgressRecord,
} from "./map-in-progress";
import {
  IN_PROGRESS_BOARD_QUERY,
  IN_PROGRESS_FRAMES_QUERY,
} from "./queries";
import type {
  InProgressRecord,
  SanityInProgressBoardDocument,
  SanityInProgressFrameDocument,
} from "./types";

const hardcoded = hardcodedInProgressRecord();

export function publishedInProgressOrFallback(
  assembled: InProgressRecord | null
): InProgressRecord {
  return assembled ?? hardcoded;
}

/**
 * Sanity is the primary In-progress source when the full collection and the
 * 4-panel board are valid. Hardcoded data is used only if the client is
 * unconfigured, the request fails, or the payload is incomplete.
 * The two lists are never merged.
 */
export async function getInProgressContent(): Promise<InProgressRecord> {
  if (process.env.NODE_ENV !== "production") {
    const { connection } = await import("next/server");
    await connection();
  }

  const client = getSanityClient();
  if (!client) return hardcoded;

  try {
    const [docs, board] = await Promise.all([
      client.fetch<SanityInProgressFrameDocument[]>(
        IN_PROGRESS_FRAMES_QUERY,
        {},
        sanityFetchOptions()
      ),
      client.fetch<SanityInProgressBoardDocument | null>(
        IN_PROGRESS_BOARD_QUERY,
        {},
        sanityFetchOptions()
      ),
    ]);
    const assembled = assembleInProgressRecord(docs, board);
    return publishedInProgressOrFallback(assembled);
  } catch (error) {
    console.error("[in-progress] Sanity fetch failed; using hardcoded frames", error);
    return hardcoded;
  }
}
