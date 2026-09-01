import { IMAGE_DEVICE_SIZES } from "@/lib/image-slots";
import { slotWidthFromSizes } from "@/lib/image-sizes";

/** Last-resort guard for hung requests on slow cellular — not a hard timeout. */
export const MEDIA_LOAD_WATCHDOG_MS = 25_000;

export type LoadAttempt = "optimized" | "retry" | "direct";
export type LoadPhase = "loading" | "revealed" | "error";

export function isSanityCdnImage(url: string): boolean {
  return /^https:\/\/cdn\.sanity\.io\/images\//.test(url);
}

function pickDeviceSize(px: number) {
  const need = Math.max(1, Math.ceil(px));
  for (const size of IMAGE_DEVICE_SIZES) {
    if (size >= need) return size;
  }
  return IMAGE_DEVICE_SIZES[IMAGE_DEVICE_SIZES.length - 1];
}

/** Sized Sanity CDN URL — bypasses `/_next/image` when the optimizer fails. */
export function buildSanityDirectUrl(
  url: string,
  width: number,
  quality: number
): string {
  const [base] = url.split("?");
  const w = Math.max(1, Math.round(width));
  const q = Math.min(100, Math.max(1, Math.round(quality)));
  return `${base}?auto=format&fit=max&w=${w}&q=${q}`;
}

export function slotPixelWidth(
  sizes: string | undefined,
  viewportWidth: number
): number {
  const vw = viewportWidth || 1080;
  const slot = sizes ? slotWidthFromSizes(sizes, vw) : vw;
  const dpr =
    typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 2;
  return pickDeviceSize(slot * dpr);
}

export function directFallbackUrl(
  originalUrl: string,
  sizes: string | undefined,
  quality: number,
  viewportWidth?: number
): string | null {
  if (isSanityCdnImage(originalUrl)) {
    const vw =
      viewportWidth ??
      (typeof window !== "undefined" ? window.innerWidth : 1080);
    return buildSanityDirectUrl(
      originalUrl,
      slotPixelWidth(sizes, vw),
      quality
    );
  }
  if (originalUrl.startsWith("/") || originalUrl.startsWith("http")) {
    return originalUrl;
  }
  return null;
}

/** Escalate: optimized → retry → direct (if available) → terminal error. */
export function nextLoadAttempt(
  current: LoadAttempt,
  canDirect: boolean
): LoadAttempt | "failed" {
  if (current === "optimized") return "retry";
  if (current === "retry") return canDirect ? "direct" : "failed";
  return "failed";
}

export function loadAttemptLabel(attempt: LoadAttempt): string {
  return attempt;
}
