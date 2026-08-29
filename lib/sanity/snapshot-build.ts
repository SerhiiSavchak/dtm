import { assembleInProgressRecord } from "./map-in-progress";
import { mapSanityProject } from "./map-project";
import {
  IN_PROGRESS_SNAPSHOT_VERSION,
  PORTFOLIO_SNAPSHOT_VERSION,
  type InProgressSnapshotFile,
  type PortfolioSnapshotFile,
} from "./snapshot";
import type {
  InProgressRecord,
  PortfolioRecord,
  SanityInProgressBoardDocument,
  SanityInProgressFrameDocument,
  SanityProjectDocument,
} from "./types";

export function buildPortfolioSnapshot(
  docs: SanityProjectDocument[] | null | undefined,
  meta: { dataset: string; generatedAt: string }
):
  | { ok: true; file: PortfolioSnapshotFile; records: PortfolioRecord[] }
  | { ok: false; reason: string } {
  const list = docs ?? [];
  if (list.length === 0) {
    return { ok: false, reason: "empty published portfolio" };
  }
  const mapped = list
    .map(mapSanityProject)
    .filter((item): item is PortfolioRecord => Boolean(item));
  if (mapped.length !== list.length) {
    return { ok: false, reason: "malformed published portfolio records" };
  }
  if (mapped.length === 0) {
    return { ok: false, reason: "no valid published portfolio records" };
  }
  return {
    ok: true,
    records: mapped,
    file: {
      version: PORTFOLIO_SNAPSHOT_VERSION,
      generatedAt: meta.generatedAt,
      dataset: meta.dataset,
      projects: mapped,
    },
  };
}

export function buildInProgressSnapshot(
  docs: SanityInProgressFrameDocument[] | null | undefined,
  board: SanityInProgressBoardDocument | null | undefined,
  meta: { dataset: string; generatedAt: string }
):
  | { ok: true; file: InProgressSnapshotFile; record: InProgressRecord }
  | { ok: false; reason: string } {
  const assembled = assembleInProgressRecord(docs, board);
  if (!assembled) {
    return { ok: false, reason: "invalid published in-progress record" };
  }
  return {
    ok: true,
    record: assembled,
    file: {
      version: IN_PROGRESS_SNAPSHOT_VERSION,
      generatedAt: meta.generatedAt,
      dataset: meta.dataset,
      frames: assembled.frames,
      boardIds: assembled.boardIds,
    },
  };
}
