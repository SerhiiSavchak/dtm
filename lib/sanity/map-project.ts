import type { Project, ProjectCategory, ProjectMedia } from "@/data/projects";
import type { Locale } from "@/lib/i18n/dictionaries";
import type {
  PortfolioRecord,
  SanityGalleryItem,
  SanityProjectDocument,
} from "./types";

const CATEGORIES: ProjectCategory[] = ["apartment", "house", "commercial"];
const SPANS: Project["span"][] = ["large", "tall", "wide", "small"];

function asParagraphs(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function pickText(
  ua: string | null | undefined,
  en: string | null | undefined,
  locale: Locale
): string | undefined {
  const uk = ua?.trim() || undefined;
  const english = en?.trim() || undefined;
  if (locale === "en") return english ?? uk;
  return uk ?? english;
}

function pickParagraphs(
  ua: string[],
  en: string[],
  locale: Locale
): string[] | undefined {
  const primary = locale === "en" ? en : ua;
  const fallback = locale === "en" ? ua : en;
  const list = primary.length > 0 ? primary : fallback;
  return list.length > 0 ? list : undefined;
}

export function parseSpan(value: string | null | undefined): Project["span"] | null {
  if (!value) return null;
  return SPANS.includes(value as Project["span"])
    ? (value as Project["span"])
    : null;
}

function parseCategory(
  value: string | null | undefined
): ProjectCategory | null {
  if (!value) return null;
  return CATEGORIES.includes(value as ProjectCategory)
    ? (value as ProjectCategory)
    : null;
}

function mapMediaItem(item: SanityGalleryItem): ProjectMedia | null {
  if (!item?.src) return null;
  const fit = item.fit === "cover" ? "cover" : "contain";
  return {
    src: item.src,
    lqip: item.lqip || undefined,
    video: item.video || undefined,
    fit,
    objectPosition: item.objectPosition?.trim() || "center center",
    thumbPosition: item.thumbPosition?.trim() || undefined,
  };
}

export function mapSanityProject(
  doc: SanityProjectDocument
): PortfolioRecord | null {
  const slug = doc.slug?.trim();
  const titleUa = doc.titleUa?.trim();
  const cover = doc.coverUrl?.trim();
  const category = parseCategory(doc.category);
  const media = (doc.gallery ?? [])
    .map(mapMediaItem)
    .filter((item): item is ProjectMedia => Boolean(item));

  if (!slug || !titleUa || !cover || !category || media.length === 0) {
    return null;
  }

  const span = parseSpan(doc.span) ?? "small";

  return {
    slug,
    titleUa,
    titleEn: doc.titleEn?.trim() || null,
    category,
    locationKey: doc.locationKey === "lviv" ? "lviv" : undefined,
    descriptionUa: asParagraphs(doc.descriptionUa),
    descriptionEn: asParagraphs(doc.descriptionEn),
    area: doc.area?.trim() || null,
    workTypeUa: doc.workTypeUa?.trim() || null,
    workTypeEn: doc.workTypeEn?.trim() || null,
    durationUa: doc.durationUa?.trim() || null,
    durationEn: doc.durationEn?.trim() || null,
    year: doc.year?.trim() || null,
    cover,
    coverLqip: doc.coverLqip || null,
    coverPosition: doc.coverPosition?.trim() || "center center",
    span,
    media,
  };
}

export function hardcodedToRecord(project: Project): PortfolioRecord {
  const description = project.description
    ? Array.isArray(project.description)
      ? project.description
      : [project.description]
    : [];

  return {
    slug: project.slug,
    titleUa: project.title,
    titleEn: null,
    category: project.category,
    locationKey: project.locationKey,
    descriptionUa: description,
    descriptionEn: [],
    area: project.area ?? null,
    workTypeUa: project.workType ?? null,
    workTypeEn: null,
    durationUa: project.duration ?? null,
    durationEn: null,
    year: project.year ?? null,
    cover: project.cover,
    coverLqip: project.coverLqip ?? null,
    coverPosition: project.coverPosition,
    span: project.span,
    media: project.media,
  };
}

export function recordToProject(
  record: PortfolioRecord,
  locale: Locale
): Project {
  return {
    slug: record.slug,
    title: pickText(record.titleUa, record.titleEn, locale) ?? record.titleUa,
    category: record.category,
    locationKey: record.locationKey,
    description: pickParagraphs(
      record.descriptionUa,
      record.descriptionEn,
      locale
    ),
    area: record.area ?? undefined,
    workType: pickText(record.workTypeUa, record.workTypeEn, locale),
    duration: pickText(record.durationUa, record.durationEn, locale),
    year: record.year ?? undefined,
    cover: record.cover,
    coverLqip: record.coverLqip ?? undefined,
    coverPosition: record.coverPosition,
    media: record.media,
    span: record.span,
  };
}
