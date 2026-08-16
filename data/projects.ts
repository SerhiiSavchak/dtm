export type ProjectCategory = "apartment" | "house" | "commercial";

export type ProjectMediaFit = "cover" | "contain";

export type ProjectMedia = {
  src: string;
  video?: string | null;
  /** Stage object-fit. Portrait/detail stills use contain; landscape/hero may cover. */
  fit: ProjectMediaFit;
  objectPosition: string;
  /** Filmstrip crop; falls back to objectPosition. */
  thumbPosition?: string;
};

export type Project = {
  slug: string;
  titleKey: "placeholder";
  category: ProjectCategory;
  locationKey?: "lviv";
  description?: string | string[];
  area?: string;
  workType?: string;
  duration?: string;
  year?: string;
  type?: string;
  cover: string;
  coverPosition: string;
  media: ProjectMedia[];
  span: "large" | "tall" | "wide" | "small";
};

function portraitStill(
  src: string,
  thumbPosition: string
): ProjectMedia {
  return {
    src,
    fit: "contain",
    objectPosition: "center center",
    thumbPosition,
  };
}

/**
 * Portfolio — verified supplied DTM photographs only.
 *
 * Visual grouping (filenames are not identities):
 * - interior-stone: gold/brass hardware, viola marble, chevron parquet,
 *   freestanding tub. One physical object.
 * - interior-living: beige handleless kitchen, black stone worktop,
 *   sculptural S-wall light, round dining table. A second physical object.
 *
 * Metadata stays placeholder. Location/area/duration/year are omitted — not verified.
 * Description is an explicit placeholder in this file only — not invented copy.
 * PNG stock/render covers (project-01…04, hero.png) are not DTM work
 * and must not appear here.
 *
 * Telegram stills are portrait (~9:16). Stage uses contain so they are not
 * cropped into unusable landscape fragments; filmstrip uses cover + thumbPosition.
 */
export const projects: Project[] = [
  {
    slug: "interior-living",
    titleKey: "placeholder",
    category: "apartment",
    description: "[Опис проєкту]",
    cover: "/images/photo_2026-08-09_15-10-55.jpg",
    coverPosition: "center 62%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-10-55.jpg", "center 62%"),
      portraitStill("/images/photo_2026-08-09_15-11-17.jpg", "center 48%"),
      portraitStill("/images/photo_2026-08-09_15-11-14.jpg", "center 42%"),
      portraitStill("/images/photo_2026-08-09_15-11-12.jpg", "center 50%"),
      portraitStill("/images/photo_2026-08-09_15-10-59.jpg", "center 46%"),
    ],
    span: "large",
  },
  {
    slug: "interior-stone",
    titleKey: "placeholder",
    category: "apartment",
    description: "[Опис проєкту]",
    cover: "/images/photo_2026-08-09_15-10-13.jpg",
    coverPosition: "center 58%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-10-13.jpg", "center 58%"),
      portraitStill("/images/photo_2026-08-09_15-10-16.jpg", "center 52%"),
      portraitStill("/images/photo_2026-08-09_15-10-41.jpg", "center 40%"),
      portraitStill("/images/photo_2026-08-09_15-10-36.jpg", "center 48%"),
      portraitStill("/images/photo_2026-08-09_15-10-43.jpg", "center 44%"),
      portraitStill("/images/photo_2026-08-09_15-10-19.jpg", "center 50%"),
    ],
    span: "tall",
  },
];

export function projectMedia(project: Project): ProjectMedia[] {
  if (project.media.length > 0) return project.media;
  return [
    {
      src: project.cover,
      fit: "cover",
      objectPosition: project.coverPosition,
    },
  ];
}
