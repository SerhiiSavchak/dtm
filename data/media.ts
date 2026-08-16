/**
 * Curated DTM media.
 *
 * Quality note: Telegram-exported JPGs (~60–160KB) soft-upscale badly in large
 * frames. Prefer 1024 PNG masters for hero / portfolio / services. Keep JPGs
 * for documentary “in progress” where authenticity > pixel density.
 */

export const heroMedia = {
  webm: null as string | null,
  /**
   * TEMPORARY development fallback: royalty-free interior loop
   * (Mixkit #43033, free license — no attribution required).
   * Own DTM videos in /videos are vertical 720×1280 phone clips and
   * crop badly on desktop. Replace this file with a self-hosted DTM
   * video when available — no component changes needed.
   */
  mp4: "/videos/hero-loop-temp.mp4" as string | null,
  /** Highest-quality landscape-capable still currently in repo */
  poster: "/images/hero.png",
  objectPosition: {
    mobile: "center 40%",
    desktop: "center 38%",
  },
} as const;

/** High-res masters for services panel (survive 4:5 crop) */
export const serviceMedia = [
  "/images/project-01.png",
  "/images/project-04.png",
  "/images/project-02.png",
  "/images/project-03.png",
] as const;

export const inProgressMedia = {
  lead: "/images/photo_2026-08-09_15-11-27.jpg",
  leadVideo: "/videos/IMG_1125.MP4" as string | null,
  /** Three equal frames for an aligned editorial baseline */
  tiles: [
    {
      src: "/images/photo_2026-08-09_15-10-34.jpg",
      stageKey: "finishing" as const,
    },
    {
      src: "/images/photo_2026-08-09_15-12-03.jpg",
      stageKey: "install" as const,
    },
    {
      src: "/images/photo_2026-08-09_15-11-39.jpg",
      stageKey: "detail" as const,
    },
  ],
} as const;

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
