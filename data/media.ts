/**
 * Curated DTM media.
 *
 * Telegram-exported JPEGs are typically 720×1280 and already compressed.
 * Do not re-encode them. Prefer them at card sizes they can survive;
 * do not present PNG stock/renders (project-01…04, hero.png) as DTM work.
 */

export const heroMedia = {
  webm: null as string | null,
  /**
   * Licensed stock interior loop — NOT a DTM project.
   * Source, licence, and encode notes: data/hero-asset.ts
   */
  mp4: "/videos/hero-loop.mp4" as string | null,
  poster: "/images/hero-poster.jpg",
  objectPosition: {
    mobile: "center 42%",
    desktop: "center 40%",
  },
} as const;

/**
 * Service panel stills: real DTM rooms used as atmosphere, not as four
 * separate named projects. Same two physical objects as Portfolio.
 */
export const serviceMedia = [
  "/images/photo_2026-08-09_15-10-55.jpg",
  "/images/photo_2026-08-09_15-10-13.jpg",
  "/images/photo_2026-08-09_15-10-41.jpg",
  "/images/photo_2026-08-09_15-11-17.jpg",
] as const;

export type InProgressLayout = "feature" | "portrait" | "landscape";

export type InProgressItem = {
  id: string;
  src: string;
  video?: string | null;
  layout: InProgressLayout;
  objectPosition: string;
  /** How many items to show before the mobile disclosure. */
  mobilePriority: boolean;
};

/**
 * «Об’єкти в роботі» — only frames with visible unfinished work.
 * Finished interiors belong in Portfolio.
 *
 * Evidence (visual, not invented stage names):
 * - house-living: plastic-wrapped chairs, empty wall outlet, open-plan house
 * - house-bedroom: mattress still in delivery film
 * - house-media: cardboard, hardware tray, loose trim on the floor
 * - kitchen-video: protective film still on a dining chair
 * - house-niche: loose cable in a built-in sofa niche
 *
 * house-* share wood floors, grey plaster, black lighting, fluted panels.
 * kitchen-video is a kitchen still being furnished; it is not labelled as
 * a separate named project.
 */
export const inProgressMedia: InProgressItem[] = [
  {
    id: "house-living",
    src: "/images/photo_2026-08-09_15-12-18.jpg",
    layout: "feature",
    objectPosition: "center 48%",
    mobilePriority: true,
  },
  {
    id: "house-bedroom",
    src: "/images/photo_2026-08-09_15-12-16.jpg",
    layout: "landscape",
    objectPosition: "center 46%",
    mobilePriority: true,
  },
  {
    id: "house-media",
    src: "/images/photo_2026-08-09_15-11-27.jpg",
    layout: "portrait",
    objectPosition: "center 42%",
    mobilePriority: true,
  },
  {
    id: "kitchen-video",
    src: "/images/in-progress-kitchen.jpg",
    video: "/videos/in-progress-kitchen.mp4",
    layout: "portrait",
    objectPosition: "center 40%",
    mobilePriority: false,
  },
  {
    id: "house-niche",
    src: "/images/photo_2026-08-09_15-12-25.jpg",
    layout: "portrait",
    objectPosition: "center 45%",
    mobilePriority: false,
  },
];

/**
 * Public social URLs. Sourced from env so components never hardcode them.
 * `NEXT_PUBLIC_TELEGRAM_URL` must be the verified DTM Telegram link
 * (https://t.me/…). Until it is set, telegram uses the contacts anchor —
 * not a real Telegram profile.
 */
export const TELEGRAM_URL_PLACEHOLDER = "#contacts" as const;

export const socialLinks = {
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || TELEGRAM_URL_PLACEHOLDER,
  phone: process.env.NEXT_PUBLIC_PHONE_URL || "#contacts",
} as const;

export function isHttpUrl(href: string) {
  return href.startsWith("https://") || href.startsWith("http://");
}

export function externalLinkProps(href: string) {
  if (!isHttpUrl(href)) return { href };
  return {
    href,
    target: "_blank" as const,
    rel: "noopener noreferrer" as const,
  };
}
