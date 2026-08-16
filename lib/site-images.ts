import type { StaticImageData } from "next/image";

import photo151013 from "@/public/images/photo_2026-08-09_15-10-13.jpg";
import photo151016 from "@/public/images/photo_2026-08-09_15-10-16.jpg";
import photo151019 from "@/public/images/photo_2026-08-09_15-10-19.jpg";
import photo151036 from "@/public/images/photo_2026-08-09_15-10-36.jpg";
import photo151041 from "@/public/images/photo_2026-08-09_15-10-41.jpg";
import photo151043 from "@/public/images/photo_2026-08-09_15-10-43.jpg";
import photo151055 from "@/public/images/photo_2026-08-09_15-10-55.jpg";
import photo151059 from "@/public/images/photo_2026-08-09_15-10-59.jpg";
import photo151112 from "@/public/images/photo_2026-08-09_15-11-12.jpg";
import photo151114 from "@/public/images/photo_2026-08-09_15-11-14.jpg";
import photo151117 from "@/public/images/photo_2026-08-09_15-11-17.jpg";
import photo151127 from "@/public/images/photo_2026-08-09_15-11-27.jpg";
import photo151216 from "@/public/images/photo_2026-08-09_15-12-16.jpg";
import photo151218 from "@/public/images/photo_2026-08-09_15-12-18.jpg";
import photo151225 from "@/public/images/photo_2026-08-09_15-12-25.jpg";
import inProgressKitchen from "@/public/images/in-progress-kitchen.jpg";
import heroPoster from "@/public/images/hero-poster.jpg";

/**
 * Public-path → static import map so Next can generate per-image blurDataURL
 * while existing data files keep string URLs.
 */
export const siteImages = {
  "/images/hero-poster.jpg": heroPoster,
  "/images/in-progress-kitchen.jpg": inProgressKitchen,
  "/images/photo_2026-08-09_15-10-13.jpg": photo151013,
  "/images/photo_2026-08-09_15-10-16.jpg": photo151016,
  "/images/photo_2026-08-09_15-10-19.jpg": photo151019,
  "/images/photo_2026-08-09_15-10-36.jpg": photo151036,
  "/images/photo_2026-08-09_15-10-41.jpg": photo151041,
  "/images/photo_2026-08-09_15-10-43.jpg": photo151043,
  "/images/photo_2026-08-09_15-10-55.jpg": photo151055,
  "/images/photo_2026-08-09_15-10-59.jpg": photo151059,
  "/images/photo_2026-08-09_15-11-12.jpg": photo151112,
  "/images/photo_2026-08-09_15-11-14.jpg": photo151114,
  "/images/photo_2026-08-09_15-11-17.jpg": photo151117,
  "/images/photo_2026-08-09_15-11-27.jpg": photo151127,
  "/images/photo_2026-08-09_15-12-16.jpg": photo151216,
  "/images/photo_2026-08-09_15-12-18.jpg": photo151218,
  "/images/photo_2026-08-09_15-12-25.jpg": photo151225,
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
