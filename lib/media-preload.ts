import { IMAGE_DEVICE_SIZES } from "@/lib/image-slots";
import { slotWidthFromSizes } from "@/lib/image-sizes";
import { resolveSiteImage, type SiteImageSrc } from "@/lib/site-images";

const cache = new Map<string, Promise<void>>();

/** Keep in sync with next.config.ts images.deviceSizes. */
const DEVICE_SIZES = IMAGE_DEVICE_SIZES;

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
