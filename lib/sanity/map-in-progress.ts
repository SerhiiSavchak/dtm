import type { InProgressItem } from "@/data/in-progress-scenes";
import {
  inProgressCompositionIds,
  inProgressMedia,
} from "@/data/in-progress-scenes";
import type {
  InProgressRecord,
  SanityInProgressBoardDocument,
  SanityInProgressFrameDocument,
} from "./types";

const SANITY_IMAGE = /^https:\/\/cdn\.sanity\.io\/images\//;
const SANITY_FILE = /^https:\/\/cdn\.sanity\.io\/files\//;

function inferMediaType(
  doc: SanityInProgressFrameDocument
): "photo" | "video" | null {
  if (doc.mediaType === "photo" || doc.mediaType === "video") {
    return doc.mediaType;
  }
  const video = doc.video?.trim();
  const src = doc.src?.trim();
  if (video && SANITY_FILE.test(video)) return "video";
  if (src && SANITY_IMAGE.test(src)) return "photo";
  return null;
}

export function mapInProgressFrame(
  doc: SanityInProgressFrameDocument
): InProgressItem | null {
  const id = doc.frameId?.trim();
  if (!id) return null;

  const mediaType = inferMediaType(doc);
  if (!mediaType) return null;

  const src = doc.src?.trim() || undefined;
  const video = doc.video?.trim() || undefined;

  if (mediaType === "photo") {
    if (!src || !SANITY_IMAGE.test(src)) return null;
    if (video && !SANITY_FILE.test(video)) return null;
    return {
      id,
      src,
      lqip: doc.lqip || undefined,
      video: video || undefined,
      objectPosition: doc.objectPosition?.trim() || "center center",
      panel: video ? "video" : "portrait",
    };
  }

  if (!video || !SANITY_FILE.test(video)) return null;
  if (src && !SANITY_IMAGE.test(src)) return null;

  return {
    id,
    src,
    lqip: doc.lqip || undefined,
    video,
    objectPosition: doc.objectPosition?.trim() || "center center",
    panel: "video",
  };
}

export function parseBoardIds(
  doc: SanityInProgressBoardDocument | null | undefined
): string[] | null {
  const ids = (doc?.boardIds ?? [])
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);
  if (ids.length !== 4) return null;
  if (new Set(ids).size !== 4) return null;
  return ids;
}

export function isValidInProgressRecord(
  frames: InProgressItem[],
  boardIds: string[]
): boolean {
  if (frames.length === 0) return false;
  if (boardIds.length !== 4) return false;
  if (new Set(boardIds).size !== 4) return false;
  const known = new Set(frames.map((item) => item.id));
  if (known.size !== frames.length) return false;
  return boardIds.every((id) => known.has(id));
}

export function compositionFromRecord(
  record: InProgressRecord
): InProgressItem[] {
  return record.boardIds
    .map((id) => record.frames.find((item) => item.id === id))
    .filter((item): item is InProgressItem => Boolean(item));
}

export function viewerIndexForFrame(
  frames: InProgressItem[],
  frameId: string
): number {
  return frames.findIndex((item) => item.id === frameId);
}

export function hardcodedInProgressRecord(): InProgressRecord {
  return {
    frames: inProgressMedia,
    boardIds: [...inProgressCompositionIds],
  };
}

export function assembleInProgressRecord(
  docs: SanityInProgressFrameDocument[] | null | undefined,
  board: SanityInProgressBoardDocument | null | undefined
): InProgressRecord | null {
  const frames = (docs ?? [])
    .map(mapInProgressFrame)
    .filter((item): item is InProgressItem => Boolean(item));
  if (frames.length !== (docs ?? []).length) return null;

  const boardIds = parseBoardIds(board);
  if (!boardIds) return null;
  if (!isValidInProgressRecord(frames, boardIds)) return null;
  return { frames, boardIds };
}
