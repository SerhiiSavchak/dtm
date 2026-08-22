/**
 * «Об’єкти зараз у роботі» — curated live-site frames only.
 *
 * Two physical objects:
 * 1. One house (wood floors, grey plaster, black lighting, fluted millwork).
 * 2. A kitchen still being furnished (poster + one loop).
 *
 * Telegram stills are 720–1280px. Never treat them as 1920 masters.
 * The on-page composition is four strong blinds; the viewer still uses the full set.
 *
 * Excluded from this section:
 * - Portfolio-prominent interiors (stone / living covers and their sets).
 * - Near-dupes of the same wall/vanity: 15-12-05, 15-11-36, 15-11-46.
 * - Extra kitchen clips (IMG_*); one kitchen video is enough.
 * - PNG stock/renders (project-01…04, hero.png).
 */

export type InProgressPanel = "wide" | "portrait" | "narrow" | "video";

export type InProgressItem = {
  id: string;
  src: string;
  video?: string | null;
  /** Optional Sanity LQIP. Local stills use site-images. */
  lqip?: string;
  objectPosition: string;
  panel: InProgressPanel;
};

export type InProgressScene = {
  id: string;
  frameIds: readonly string[];
};

export const inProgressMedia: InProgressItem[] = [
  {
    id: "house-living",
    src: "/images/photo_2026-08-09_15-12-18.jpg",
    objectPosition: "62% 46%",
    panel: "wide",
  },
  {
    id: "house-media",
    src: "/images/photo_2026-08-09_15-11-27.jpg",
    objectPosition: "58% 42%",
    panel: "portrait",
  },
  {
    id: "house-niche",
    src: "/images/photo_2026-08-09_15-12-25.jpg",
    objectPosition: "70% 52%",
    panel: "portrait",
  },
  {
    id: "house-sconce",
    src: "/images/photo_2026-08-09_15-12-28.jpg",
    objectPosition: "50% 40%",
    panel: "narrow",
  },
  {
    id: "house-bedroom",
    src: "/images/photo_2026-08-09_15-12-16.jpg",
    objectPosition: "54% 38%",
    panel: "wide",
  },
  {
    id: "house-bed-two",
    src: "/images/photo_2026-08-09_15-12-03.jpg",
    objectPosition: "50% 42%",
    panel: "portrait",
  },
  {
    id: "house-vanity",
    src: "/images/photo_2026-08-09_15-12-11.jpg",
    objectPosition: "52% 40%",
    panel: "portrait",
  },
  {
    id: "house-wardrobe",
    src: "/images/photo_2026-08-09_15-12-22.jpg",
    objectPosition: "46% 48%",
    panel: "portrait",
  },
  {
    id: "house-bath",
    src: "/images/photo_2026-08-09_15-12-20.jpg",
    objectPosition: "48% 46%",
    panel: "portrait",
  },
  {
    id: "kitchen-video",
    src: "/images/in-progress-kitchen.jpg",
    video: "/videos/in-progress-kitchen.mp4",
    objectPosition: "50% 42%",
    panel: "video",
  },
];

/**
 * One on-page composition. Order: living → bedroom → vanity → kitchen.
 * All four stay on screen as architectural blinds. Viewer uses the full set.
 */
export const inProgressCompositionIds = [
  "house-living",
  "house-bedroom",
  "house-vanity",
  "kitchen-video",
] as const;

export const inProgressScenes: InProgressScene[] = [
  {
    id: "site",
    frameIds: inProgressCompositionIds,
  },
];

export function inProgressFrames(scene: InProgressScene): InProgressItem[] {
  return scene.frameIds
    .map((id) => inProgressMedia.find((item) => item.id === id))
    .filter((item): item is InProgressItem => Boolean(item));
}

export function inProgressComposition(): InProgressItem[] {
  return inProgressFrames(inProgressScenes[0]!);
}

export function inProgressMediaIndex(id: string): number {
  return inProgressMedia.findIndex((item) => item.id === id);
}
