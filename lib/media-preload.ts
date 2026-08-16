import { resolveSiteImage, type SiteImageSrc } from "@/lib/site-images";

const cache = new Map<string, Promise<void>>();

function fileUrl(src: SiteImageSrc) {
  const resolved = resolveSiteImage(src);
  return typeof resolved === "string" ? resolved : resolved.src;
}

function optimizedUrl(file: string, width: number, quality = 75) {
  return `/_next/image?url=${encodeURIComponent(file)}&w=${width}&q=${quality}`;
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

/** Preload the static file and the Next optimizer URL used by the modal stage. */
export function preloadSiteImage(src: SiteImageSrc) {
  if (typeof window === "undefined") return Promise.resolve();
  const file = fileUrl(src);
  const width = window.innerWidth < 1024 ? 828 : 1920;
  return Promise.all([
    decodeImage(file),
    decodeImage(optimizedUrl(file, width)),
  ]).then(() => undefined);
}

export function preloadSiteImages(srcs: SiteImageSrc[]) {
  const unique = [...new Set(srcs)];
  return Promise.all(unique.map((src) => preloadSiteImage(src)));
}
