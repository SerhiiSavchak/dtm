export type ProjectCategory = "apartment" | "house" | "commercial";

export type Project = {
  slug: string;
  /** Display title — keep explicit placeholders until verified */
  titleKey: "placeholder";
  category: ProjectCategory;
  locationKey: "lviv";
  /** Keep as placeholder string; never invent square metres */
  area: string;
  cover: string;
  gallery: string[];
  span: "large" | "tall" | "wide" | "small";
};

/**
 * Central portfolio source. Replace placeholders with verified DTM project
 * data when available — never invent names, budgets, or areas.
 */
export const projects: Project[] = [
  {
    slug: "project-01",
    titleKey: "placeholder",
    category: "apartment",
    locationKey: "lviv",
    area: "[площа]",
    cover: "/images/project-01.png",
    gallery: ["/images/project-01.png"],
    span: "large",
  },
  {
    slug: "project-02",
    titleKey: "placeholder",
    category: "house",
    locationKey: "lviv",
    area: "[площа]",
    cover: "/images/project-02.png",
    gallery: ["/images/project-02.png"],
    span: "tall",
  },
  {
    slug: "project-03",
    titleKey: "placeholder",
    category: "apartment",
    locationKey: "lviv",
    area: "[площа]",
    cover: "/images/project-03.png",
    gallery: ["/images/project-03.png"],
    span: "small",
  },
  {
    slug: "project-04",
    titleKey: "placeholder",
    category: "commercial",
    locationKey: "lviv",
    area: "[площа]",
    cover: "/images/project-04.png",
    gallery: ["/images/project-04.png"],
    span: "wide",
  },
];
