import { resolveSiteImage, type SiteImageSrc } from "@/lib/site-images";

const cache = new Map<string, Promise<void>>();

/** Next.js default deviceSizes — keep in sync with the optimizer. */
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

function fileUrl(src: SiteImageSrc) {
  const resolved = resolveSiteImage(src);
  return typeof resolved === "string" ? resolved : resolved.src;
}

function optimizedUrl(file: string, width: number, quality = 75) {
  return `/_next/image?url=${encodeURIComponent(file)}&w=${width}&q=${quality}`;
}

function pickDeviceSize(px: number) {
  const need = Math.max(1, Math.ceil(px));
  for (const size of DEVICE_SIZES) {
    if (size >= need) return size;
  }
  return DEVICE_SIZES[DEVICE_SIZES.length - 1];
}

function lengthToPx(expr: string, vw: number): number {
  const value = expr.trim();
  const min = value.match(/^min\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (min) return Math.min(lengthToPx(min[1], vw), lengthToPx(min[2], vw));
  const max = value.match(/^max\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (max) return Math.max(lengthToPx(max[1], vw), lengthToPx(max[2], vw));
  if (value.endsWith("vw")) return (Number.parseFloat(value) / 100) * vw;
  if (value.endsWith("rem")) return Number.parseFloat(value) * 16;
  if (value.endsWith("px")) return Number.parseFloat(value);
  if (value === "100vw") return vw;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : vw;
}

/** Dest width from a Next `sizes` string for the current viewport. */
export function slotWidthFromSizes(sizes: string, viewportWidth: number): number {
  const parts = sizes.split(",").map((part) => part.trim());
  for (const part of parts) {
    const mq = part.match(/^\(max-width:\s*(\d+)px\)\s+(.+)$/);
    if (mq) {
      if (viewportWidth <= Number(mq[1])) return lengthToPx(mq[2], viewportWidth);
      continue;
    }
    return lengthToPx(part, viewportWidth);
  }
  return viewportWidth;
}

function decodeImage(url: string) {
  const hit = cache.get(url);
  if (hit) return hit;

  const pending = new Promise<void>((resolve) => {
    const img = new Image();
    const finish = () => resolve();
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(finish, finish);
      } else {
        finish();
      }
    };
    img.onerror = finish;
    img.src = url;
  });

  cache.set(url, pending);
  return pending;
}

export type PreloadImageOptions = {
  sizes?: string;
  quality?: number;
};

/**
 * Decode the Next optimizer URL that the visible `<Image>` will actually
 * request. Preloading a mismatched `w=` (e.g. 1920 when the stage uses 1080)
 * does not warm the cache the modal reads from.
 */
export function preloadSiteImage(
  src: SiteImageSrc,
  options: PreloadImageOptions = {}
) {
  if (typeof window === "undefined") return Promise.resolve();
  const file = fileUrl(src);
  const quality = options.quality ?? 75;
  const vw = window.innerWidth || 1080;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const slot = options.sizes
    ? slotWidthFromSizes(options.sizes, vw)
    : vw < 1024
      ? vw
      : Math.min(vw * 0.68, 72 * 16);
  const width = pickDeviceSize(slot * dpr);
  return decodeImage(optimizedUrl(file, width, quality));
}

export function preloadSiteImages(
  srcs: SiteImageSrc[],
  options: PreloadImageOptions = {}
) {
  const unique = [...new Set(srcs)];
  return Promise.all(unique.map((src) => preloadSiteImage(src, options)));
}
