export type ProjectCategory = "apartment" | "house" | "commercial";

export type Project = {
  slug: string;
  titleKey: "placeholder";
  category: ProjectCategory;
  locationKey?: "lviv";
  area?: string;
  cover: string;
  coverPosition: string;
  gallery: string[];
  span: "large" | "tall" | "wide" | "small";
};

/**
 * Portfolio — verified supplied DTM photographs only.
 *
 * Visual grouping (filenames are not identities):
 * - interior-stone: gold/brass hardware, viola marble, chevron parquet,
 *   freestanding tub. One physical object.
 * - interior-living: beige handleless kitchen, black stone worktop,
 *   sculptural S-wall light, round dining table. A second physical object.
 *
 * Metadata stays placeholder. Location/area are omitted — not verified.
 * PNG stock/render covers (project-01…04, hero.png) are not DTM work
 * and must not appear here.
 */
export const projects: Project[] = [
  {
    slug: "interior-living",
    titleKey: "placeholder",
    category: "apartment",
    cover: "/images/photo_2026-08-09_15-10-55.jpg",
    coverPosition: "center 62%",
    gallery: [
      "/images/photo_2026-08-09_15-10-55.jpg",
      "/images/photo_2026-08-09_15-11-17.jpg",
      "/images/photo_2026-08-09_15-11-14.jpg",
      "/images/photo_2026-08-09_15-11-12.jpg",
      "/images/photo_2026-08-09_15-10-59.jpg",
    ],
    span: "large",
  },
  {
    slug: "interior-stone",
    titleKey: "placeholder",
    category: "apartment",
    cover: "/images/photo_2026-08-09_15-10-13.jpg",
    coverPosition: "center 58%",
    gallery: [
      "/images/photo_2026-08-09_15-10-13.jpg",
      "/images/photo_2026-08-09_15-10-16.jpg",
      "/images/photo_2026-08-09_15-10-41.jpg",
      "/images/photo_2026-08-09_15-10-36.jpg",
      "/images/photo_2026-08-09_15-10-43.jpg",
      "/images/photo_2026-08-09_15-10-19.jpg",
    ],
    span: "tall",
  },
];
