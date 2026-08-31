import type { PreviewValue } from "sanity";

export const OBJECT_TYPE_LABELS: Record<string, string> = {
  new_build: "Новобудова",
  secondary: "Вторинне житло",
  private_house: "Приватний будинок",
  commercial: "Комерційне приміщення",
};

export const CATEGORY_LABELS: Record<string, string> = {
  apartment: "Квартира",
  house: "Будинок",
  commercial: "Комерційне приміщення",
};

export const FRAME_ADMIN_TITLES: Record<string, string> = {
  "house-living": "Вітальня",
  "house-media": "Медіазона",
  "house-niche": "Ніша",
  "house-sconce": "Бра",
  "house-bedroom": "Спальня",
  "house-bed-two": "Спальня — друге фото",
  "house-vanity": "Санвузол",
  "house-wardrobe": "Гардероб",
  "house-bath": "Ванна",
  "kitchen-video": "Кухня — відео",
};

export function projectListPreview(args: {
  title?: string;
  objectType?: string;
  category?: string;
  area?: string;
  media?: PreviewValue["media"];
}) {
  const typeLabel =
    OBJECT_TYPE_LABELS[args.objectType ?? ""] ??
    CATEGORY_LABELS[args.category ?? ""] ??
    "";
  return {
    title: args.title?.trim() || "Без назви",
    subtitle: [typeLabel, args.area].filter(Boolean).join(" · "),
    media: args.media,
  };
}

export function galleryItemPreview(args: {
  media?: PreviewValue["media"];
  filename?: string;
  video?: unknown;
}) {
  return {
    title: args.filename || (args.video ? "Фото з відео" : "Фото"),
    subtitle: args.video ? "Є відео" : undefined,
    media: args.media,
  };
}

export function frameListPreview(args: {
  label?: string;
  frameId?: string;
  mediaType?: string;
  still?: unknown;
  poster?: unknown;
  media?: PreviewValue["media"];
  video?: unknown;
  filename?: string;
}) {
  const kind =
    args.mediaType === "video"
      ? args.poster || args.still
        ? "Відео + обкладинка"
        : "Відео"
      : args.video
        ? "Відео + фото"
        : "Фото";
  const fallback =
    (typeof args.frameId === "string" && FRAME_ADMIN_TITLES[args.frameId]) ||
    args.filename ||
    (args.mediaType === "video" || args.video ? "Відео" : "Фото");
  const previewMedia = (args.poster ?? args.still ?? args.media) as
    | PreviewValue["media"]
    | undefined;
  return {
    title: (typeof args.label === "string" && args.label.trim()) || fallback,
    subtitle: kind,
    media: previewMedia,
  };
}

export function uniqueBoardRefs(
  blinds: { _ref?: string }[] | undefined
): true | string {
  if (!blinds) return "Потрібно рівно 4 матеріали";
  const refs = blinds.map((item) => item?._ref).filter(Boolean);
  if (refs.length !== 4) return "Потрібно рівно 4 матеріали";
  if (new Set(refs).size !== refs.length) {
    return "Кожен матеріал можна вибрати лише один раз";
  }
  return true;
}
