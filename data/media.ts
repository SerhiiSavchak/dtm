/**
 * Hero media sources. Drop optimized files into /public/videos and set paths.
 * Until then, poster image is the stable full-bleed fallback (no CLS).
 *
 * Recommended production set:
 *   /videos/hero.webm
 *   /videos/hero.mp4
 *   /images/hero.png (poster)
 */
export const heroMedia = {
  /** WebM first when available */
  webm: null as string | null,
  /** MP4 fallback */
  mp4: null as string | null,
  poster: "/images/hero.png",
  objectPosition: {
    mobile: "center center",
    desktop: "center 40%",
  },
} as const;

/** Contextual stills for the interactive services panel */
export const serviceMedia = [
  "/images/project-01.png",
  "/images/project-02.png",
  "/images/project-04.png",
  "/images/detail-01.png",
] as const;
