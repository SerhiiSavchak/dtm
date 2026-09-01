import type { Locale } from "@/lib/i18n/dictionaries";

/** Format optional area as a single atomic string, or null when absent. */
export function formatInProgressArea(
  area: number | null | undefined,
  locale: Locale = "uk"
): string | null {
  if (typeof area !== "number" || !Number.isFinite(area) || area <= 0) {
    return null;
  }
  const value = Number.isInteger(area) ? String(area) : String(area);
  const unit = locale === "en" ? "m²" : "м²";
  return `${value}\u00A0${unit}`;
}

export function resolveInProgressTitle(
  item: { titleUa?: string | null; titleEn?: string | null },
  locale: Locale = "uk"
): string | null {
  const ua = item.titleUa?.trim() || "";
  const en = item.titleEn?.trim() || "";
  if (locale === "en") return en || ua || null;
  return ua || null;
}

export function formatInProgressViewerMeta(
  item: {
    titleUa?: string | null;
    titleEn?: string | null;
    area?: number | null;
  },
  locale: Locale = "uk"
): string | null {
  const title = resolveInProgressTitle(item, locale);
  if (!title) return null;
  const area = formatInProgressArea(item.area, locale);
  return area ? `${title} · ${area}` : title;
}
