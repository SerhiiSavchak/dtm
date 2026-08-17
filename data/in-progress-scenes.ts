/**
 * «Об’єкти зараз у роботі» — curated live-site frames only.
 *
 * Grouped by physical object, not one card per photograph.
 * Room chapters of the same house stay one object (no invented project names).
 * Portfolio interiors (stone / living) are excluded — they already lead nearby.
 */

export type InProgressItem = {
  id: string;
  src: string;
  video?: string | null;
  objectPosition: string;
  role: "hero" | "portrait" | "detail" | "video";
};

export type InProgressLayout = "a" | "b" | "c";

export type InProgressScene = {
  id: string;
  layout: InProgressLayout;
  frameIds: readonly string[];
};

export const inProgressMedia: InProgressItem[] = [
  {
    id: "house-living",
    src: "/images/photo_2026-08-09_15-12-18.jpg",
    objectPosition: "62% 46%",
    role: "hero",
  },
  {
    id: "house-media",
    src: "/images/photo_2026-08-09_15-11-27.jpg",
    objectPosition: "58% 42%",
    role: "portrait",
  },
  {
    id: "house-niche",
    src: "/images/photo_2026-08-09_15-12-25.jpg",
    objectPosition: "70% 52%",
    role: "detail",
  },
  {
    id: "house-bedroom",
    src: "/images/photo_2026-08-09_15-12-16.jpg",
    objectPosition: "54% 38%",
    role: "hero",
  },
  {
    id: "house-flutes",
    src: "/images/photo_2026-08-09_15-12-05.jpg",
    objectPosition: "48% 42%",
    role: "portrait",
  },
  {
    id: "house-dress-wall",
    src: "/images/photo_2026-08-09_15-11-36.jpg",
    objectPosition: "50% 44%",
    role: "detail",
  },
  {
    id: "house-vanity",
    src: "/images/photo_2026-08-09_15-12-11.jpg",
    objectPosition: "52% 40%",
    role: "hero",
  },
  {
    id: "house-wardrobe",
    src: "/images/photo_2026-08-09_15-12-22.jpg",
    objectPosition: "46% 48%",
    role: "portrait",
  },
  {
    id: "house-flute-cut",
    src: "/images/photo_2026-08-09_15-11-46.jpg",
    objectPosition: "50% 52%",
    role: "detail",
  },
  {
    id: "house-bed-two",
    src: "/images/photo_2026-08-09_15-12-03.jpg",
    objectPosition: "50% 42%",
    role: "hero",
  },
  {
    id: "house-bath",
    src: "/images/photo_2026-08-09_15-12-20.jpg",
    objectPosition: "48% 46%",
    role: "portrait",
  },
  {
    id: "house-sconce",
    src: "/images/photo_2026-08-09_15-12-28.jpg",
    objectPosition: "50% 40%",
    role: "detail",
  },
  {
    id: "kitchen-video",
    src: "/images/in-progress-kitchen.jpg",
    video: "/videos/in-progress-kitchen.mp4",
    objectPosition: "50% 42%",
    role: "video",
  },
];

/**
 * Five scroll scenes. 1–4 are rooms of the same house (wood floors, grey
 * plaster, black lighting, fluted panels). 5 is a separate kitchen still
 * being furnished. No per-scene titles — none exist in verified copy.
 */
export const inProgressScenes: InProgressScene[] = [
  {
    id: "living",
    layout: "b",
    frameIds: ["house-living", "house-media", "house-niche"],
  },
  {
    id: "bedroom",
    layout: "b",
    frameIds: ["house-bedroom", "house-flutes", "house-dress-wall"],
  },
  {
    id: "dressing",
    layout: "b",
    frameIds: ["house-vanity", "house-wardrobe", "house-flute-cut"],
  },
  {
    id: "rooms",
    layout: "b",
    frameIds: ["house-bed-two", "house-bath", "house-sconce"],
  },
  {
    id: "kitchen",
    layout: "c",
    frameIds: ["kitchen-video"],
  },
];

export function inProgressFrames(scene: InProgressScene): InProgressItem[] {
  return scene.frameIds
    .map((id) => inProgressMedia.find((item) => item.id === id))
    .filter((item): item is InProgressItem => Boolean(item));
}

export function inProgressMediaIndex(id: string): number {
  return inProgressMedia.findIndex((item) => item.id === id);
}
