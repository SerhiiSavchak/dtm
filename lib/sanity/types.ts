import type { InProgressItem } from "@/data/in-progress-scenes";
import type { Project, ProjectCategory, ProjectMedia } from "@/data/projects";
import type { Locale } from "@/lib/i18n/dictionaries";

export type SanityGalleryItem = {
  src?: string | null;
  lqip?: string | null;
  video?: string | null;
  fit?: string | null;
  objectPosition?: string | null;
  thumbPosition?: string | null;
};

export type SanityProjectDocument = {
  titleUa?: string | null;
  titleEn?: string | null;
  slug?: string | null;
  category?: string | null;
  locationKey?: string | null;
  descriptionUa?: unknown;
  descriptionEn?: unknown;
  area?: string | null;
  workTypeUa?: string | null;
  workTypeEn?: string | null;
  durationUa?: string | null;
  durationEn?: string | null;
  year?: string | null;
  coverUrl?: string | null;
  coverLqip?: string | null;
  coverPosition?: string | null;
  span?: string | null;
  gallery?: SanityGalleryItem[] | null;
};

/** Bilingual CMS record. Locale is resolved on the client. */
export type PortfolioRecord = {
  slug: string;
  titleUa: string;
  titleEn: string | null;
  category: ProjectCategory;
  locationKey?: "lviv";
  descriptionUa: string[];
  descriptionEn: string[];
  area: string | null;
  workTypeUa: string | null;
  workTypeEn: string | null;
  durationUa: string | null;
  durationEn: string | null;
  year: string | null;
  cover: string;
  coverLqip: string | null;
  coverPosition: string;
  span: Project["span"];
  media: ProjectMedia[];
};

export type SanityInProgressFrameDocument = {
  _id?: string | null;
  frameId?: string | null;
  objectPosition?: string | null;
  orderRank?: string | null;
  src?: string | null;
  lqip?: string | null;
  video?: string | null;
};

export type SanityInProgressBoardDocument = {
  boardIds?: (string | null)[] | null;
};

/** Full collection + exactly four homepage panel identities. */
export type InProgressRecord = {
  frames: InProgressItem[];
  boardIds: string[];
};

export type { Locale, Project, ProjectMedia, InProgressItem };
