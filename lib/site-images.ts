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
import photo151136 from "@/public/images/photo_2026-08-09_15-11-36.jpg";
import photo151146 from "@/public/images/photo_2026-08-09_15-11-46.jpg";
import photo151203 from "@/public/images/photo_2026-08-09_15-12-03.jpg";
import photo151205 from "@/public/images/photo_2026-08-09_15-12-05.jpg";
import photo151211 from "@/public/images/photo_2026-08-09_15-12-11.jpg";
import photo151216 from "@/public/images/photo_2026-08-09_15-12-16.jpg";
import photo151218 from "@/public/images/photo_2026-08-09_15-12-18.jpg";
import photo151220 from "@/public/images/photo_2026-08-09_15-12-20.jpg";
import photo151222 from "@/public/images/photo_2026-08-09_15-12-22.jpg";
import photo151225 from "@/public/images/photo_2026-08-09_15-12-25.jpg";
import photo151228 from "@/public/images/photo_2026-08-09_15-12-28.jpg";
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
  "/images/photo_2026-08-09_15-11-36.jpg": photo151136,
  "/images/photo_2026-08-09_15-11-46.jpg": photo151146,
  "/images/photo_2026-08-09_15-12-03.jpg": photo151203,
  "/images/photo_2026-08-09_15-12-05.jpg": photo151205,
  "/images/photo_2026-08-09_15-12-11.jpg": photo151211,
  "/images/photo_2026-08-09_15-12-16.jpg": photo151216,
  "/images/photo_2026-08-09_15-12-18.jpg": photo151218,
  "/images/photo_2026-08-09_15-12-20.jpg": photo151220,
  "/images/photo_2026-08-09_15-12-22.jpg": photo151222,
  "/images/photo_2026-08-09_15-12-25.jpg": photo151225,
  "/images/photo_2026-08-09_15-12-28.jpg": photo151228,
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
