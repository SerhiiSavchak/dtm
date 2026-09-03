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
  /** 720p muted derivative for mobile — same loop, lower initial bytes. */
  mp4Mobile: "/videos/hero-loop-720.mp4" as string | null,
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

export {
  inProgressComposition,
  inProgressFrames,
  inProgressMedia,
  inProgressMediaIndex,
  inProgressScenes,
  type InProgressItem,
  type InProgressPanel,
  type InProgressScene,
} from "./in-progress-scenes";

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
