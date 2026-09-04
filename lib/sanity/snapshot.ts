import type { InProgressRecord, PortfolioRecord } from "./types";

export const PORTFOLIO_SNAPSHOT_VERSION = 1;
export const IN_PROGRESS_SNAPSHOT_VERSION = 1;

export type PortfolioSnapshotFile = {
  version: number;
  generatedAt: string;
  dataset: string;
  projects: PortfolioRecord[];
};

export type InProgressSnapshotFile = {
  version: number;
  generatedAt: string;
  dataset: string;
  frames: InProgressRecord["frames"];
  boardIds: InProgressRecord["boardIds"];
};

const PORTFOLIO_SPANS = ["large", "tall", "wide", "small"] as const;
const MEDIA_FITS = ["contain", "cover"] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPortfolioSpan(value: unknown): value is (typeof PORTFOLIO_SPANS)[number] {
  return (
    typeof value === "string" &&
    (PORTFOLIO_SPANS as readonly string[]).includes(value)
  );
}

export function isValidPortfolioSnapshot(
  value: unknown
): value is PortfolioSnapshotFile {
  if (!value || typeof value !== "object") return false;
  const file = value as PortfolioSnapshotFile;
  if (file.version !== PORTFOLIO_SNAPSHOT_VERSION) return false;
  if (!Array.isArray(file.projects) || file.projects.length === 0) return false;
  const slugs = new Set<string>();
  for (const project of file.projects) {
    if (!isNonEmptyString(project?.slug) || !isNonEmptyString(project?.titleUa)) {
      return false;
    }
    if (!isNonEmptyString(project?.cover) || !Array.isArray(project.media)) {
      return false;
    }
    if (project.media.length === 0) return false;
    if (!isPortfolioSpan(project.span)) return false;
    if (!isNonEmptyString(project.coverPosition)) return false;
    for (const item of project.media) {
      if (!isNonEmptyString(item?.src)) return false;
      if (!(MEDIA_FITS as readonly string[]).includes(item.fit)) return false;
      if (!isNonEmptyString(item.objectPosition)) return false;
    }
    if (slugs.has(project.slug)) return false;
    slugs.add(project.slug);
  }
  return true;
}

export function isValidInProgressSnapshot(
  value: unknown
): value is InProgressSnapshotFile {
  if (!value || typeof value !== "object") return false;
  const file = value as InProgressSnapshotFile;
  if (file.version !== IN_PROGRESS_SNAPSHOT_VERSION) return false;
  if (!Array.isArray(file.frames) || file.frames.length === 0) return false;
  if (!Array.isArray(file.boardIds) || file.boardIds.length !== 4) return false;
  if (new Set(file.boardIds).size !== 4) return false;
  const known = new Set<string>();
  for (const frame of file.frames) {
    if (!isNonEmptyString(frame?.id)) return false;
    if (known.has(frame.id)) return false;
    known.add(frame.id);
    if (!isNonEmptyString(frame.objectPosition)) return false;
    if (frame.video && frame.previewVideo && frame.previewVideo === frame.video) {
      return false;
    }
  }
  return file.boardIds.every((id) => known.has(id));
}
