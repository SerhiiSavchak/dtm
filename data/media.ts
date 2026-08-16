/**
 * Curated DTM media.
 *
 * Telegram-exported JPEGs are typically 720×1280 and already compressed.
 * Do not re-encode them. Prefer them at card sizes they can survive;
 * do not present PNG stock/renders (project-01…04, hero.png) as DTM work.
 */

import {
  PUBLIC_INSTAGRAM_URL,
  PUBLIC_TELEGRAM_URL,
} from "@/lib/leads/labels";

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
 * objectPosition is for the desktop 4/5 portrait panel (Telegram JPEGs are 9:16).
 */
export const serviceMedia = [
  {
    src: "/images/photo_2026-08-09_15-10-55.jpg",
    objectPosition: "center 46%",
  },
  {
    src: "/images/photo_2026-08-09_15-10-13.jpg",
    objectPosition: "center 52%",
  },
  {
    src: "/images/photo_2026-08-09_15-10-41.jpg",
    objectPosition: "center 40%",
  },
  {
    src: "/images/photo_2026-08-09_15-11-17.jpg",
    objectPosition: "center 48%",
  },
] as const;

export type InProgressItem = {
  id: string;
  src: string;
  video?: string | null;
  objectPosition: string;
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
    objectPosition: "62% 46%",
  },
  {
    id: "house-media",
    src: "/images/photo_2026-08-09_15-11-27.jpg",
    objectPosition: "58% 42%",
  },
  {
    id: "house-bedroom",
    src: "/images/photo_2026-08-09_15-12-16.jpg",
    objectPosition: "54% 38%",
  },
  {
    id: "kitchen-video",
    src: "/images/in-progress-kitchen.jpg",
    video: "/videos/in-progress-kitchen.mp4",
    objectPosition: "78% 42%",
  },
  {
    id: "house-niche",
    src: "/images/photo_2026-08-09_15-12-25.jpg",
    objectPosition: "70% 52%",
  },
];

/**
 * Public social URLs. Verified DTM destinations are the defaults.
 * Optional NEXT_PUBLIC_* overrides remain for staging, but public Telegram
 * is never a Bot API chat id.
 */
export const TELEGRAM_URL_PLACEHOLDER = PUBLIC_TELEGRAM_URL;

export const socialLinks = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || PUBLIC_INSTAGRAM_URL,
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || PUBLIC_TELEGRAM_URL,
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
