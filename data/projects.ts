export type ProjectCategory = "apartment" | "house" | "commercial";

export type Project = {
  slug: string;
  titleKey: "placeholder";
  category: ProjectCategory;
  locationKey?: "lviv";
  area?: string;
  cover: string;
  gallery: string[];
  span: "large" | "tall" | "wide" | "small";
};

/**
 * Portfolio — PNG masters for cover sharpness; JPG extras only in galleries.
 * Metadata stays placeholder until verified.
 */
export const projects: Project[] = [
  {
    slug: "project-01",
    titleKey: "placeholder",
    category: "apartment",
    locationKey: "lviv",
    cover: "/images/project-01.png",
    gallery: [
      "/images/project-01.png",
      "/images/photo_2026-08-09_15-11-14.jpg",
      "/images/photo_2026-08-09_15-11-02.jpg",
    ],
    span: "large",
  },
  {
    slug: "project-02",
    titleKey: "placeholder",
    category: "apartment",
    locationKey: "lviv",
    cover: "/images/project-02.png",
    gallery: [
      "/images/project-02.png",
      "/images/photo_2026-08-09_15-12-16.jpg",
    ],
    span: "tall",
  },
  {
    slug: "project-03",
    titleKey: "placeholder",
    category: "apartment",
    locationKey: "lviv",
    cover: "/images/project-03.png",
    gallery: [
      "/images/project-03.png",
      "/images/photo_2026-08-09_15-10-13.jpg",
    ],
    span: "small",
  },
  {
    slug: "project-04",
    titleKey: "placeholder",
    category: "house",
    locationKey: "lviv",
    cover: "/images/project-04.png",
    gallery: [
      "/images/project-04.png",
      "/images/photo_2026-08-09_15-12-18.jpg",
      "/images/hero.png",
    ],
    span: "wide",
  },
];
