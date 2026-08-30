import { getSanityClient, sanityFetchOptions } from "./client";
import { lastKnownGoodInProgress } from "./last-known-good";
import { assembleInProgressRecord } from "./map-in-progress";
import {
  IN_PROGRESS_BOARD_QUERY,
  IN_PROGRESS_FRAMES_QUERY,
} from "./queries";
import type {
  InProgressRecord,
  SanityInProgressBoardDocument,
  SanityInProgressFrameDocument,
} from "./types";

export function publishedInProgressOrFallback(
  assembled: InProgressRecord | null,
  fallback: InProgressRecord = lastKnownGoodInProgress()
): InProgressRecord {
  return assembled ?? fallback;
}

/**
 * Sanity is the primary In-progress source when the full collection and the
 * 4-panel board are valid. Last-known-good snapshot (or hardcoded demo) is
 * used only if the client is unconfigured, the request fails, or the payload
 * is incomplete. The two lists are never merged.
 */
export async function getInProgressContent(): Promise<InProgressRecord> {
  if (process.env.NODE_ENV !== "production") {
    const { connection } = await import("next/server");
    await connection();
  }

  const fallback = lastKnownGoodInProgress();
  if (process.env.NODE_ENV !== "production") {
    const { headers } = await import("next/headers");
    const simulate = (await headers()).get("x-dtm-simulate-sanity-failure");
    if (simulate === "1") {
      console.error("[in-progress] simulated Sanity failure; using last-known-good");
      return fallback;
    }
  }

  const client = getSanityClient();
  if (!client) return fallback;

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
    return publishedInProgressOrFallback(assembled, fallback);
  } catch (error) {
    console.error("[in-progress] Sanity fetch failed; using last-known-good", error);
    return fallback;
  }
}
