import type { StaticImageData } from "next/image";

import hero from "@/public/images/hero.png";
import project01 from "@/public/images/project-01.png";
import project02 from "@/public/images/project-02.png";
import project03 from "@/public/images/project-03.png";
import project04 from "@/public/images/project-04.png";
import photo151127 from "@/public/images/photo_2026-08-09_15-11-27.jpg";
import photo151034 from "@/public/images/photo_2026-08-09_15-10-34.jpg";
import photo151203 from "@/public/images/photo_2026-08-09_15-12-03.jpg";
import photo151139 from "@/public/images/photo_2026-08-09_15-11-39.jpg";
import photo151114 from "@/public/images/photo_2026-08-09_15-11-14.jpg";
import photo151102 from "@/public/images/photo_2026-08-09_15-11-02.jpg";
import photo151216 from "@/public/images/photo_2026-08-09_15-12-16.jpg";
import photo151013 from "@/public/images/photo_2026-08-09_15-10-13.jpg";
import photo151218 from "@/public/images/photo_2026-08-09_15-12-18.jpg";

/**
 * Public-path → static import map so Next can generate per-image blurDataURL
 * while existing data files keep string URLs.
 */
export const siteImages = {
  "/images/hero.png": hero,
  "/images/project-01.png": project01,
  "/images/project-02.png": project02,
  "/images/project-03.png": project03,
  "/images/project-04.png": project04,
  "/images/photo_2026-08-09_15-11-27.jpg": photo151127,
  "/images/photo_2026-08-09_15-10-34.jpg": photo151034,
  "/images/photo_2026-08-09_15-12-03.jpg": photo151203,
  "/images/photo_2026-08-09_15-11-39.jpg": photo151139,
  "/images/photo_2026-08-09_15-11-14.jpg": photo151114,
  "/images/photo_2026-08-09_15-11-02.jpg": photo151102,
  "/images/photo_2026-08-09_15-12-16.jpg": photo151216,
  "/images/photo_2026-08-09_15-10-13.jpg": photo151013,
  "/images/photo_2026-08-09_15-12-18.jpg": photo151218,
} satisfies Record<string, StaticImageData>;

export type SiteImageSrc = keyof typeof siteImages | StaticImageData | string;

export function resolveSiteImage(
  src: SiteImageSrc
): StaticImageData | string {
  if (typeof src !== "string") return src;
  return src in siteImages
    ? siteImages[src as keyof typeof siteImages]
    : src;
}

export function getBlurDataUrl(src: SiteImageSrc): string | undefined {
  const resolved = resolveSiteImage(src);
  if (typeof resolved === "string") return undefined;
  return resolved.blurDataURL;
}
