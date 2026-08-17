/**
 * Shared Next/Image slot widths and qualities.
 * Keep in sync with next.config.ts `images.deviceSizes` / `images.qualities`
 * and with the CSS that actually sizes each surface.
 */

/** Must match next.config.ts images.deviceSizes. */
export const IMAGE_DEVICE_SIZES = [
  640, 750, 828, 960, 1080, 1200, 1280, 1920, 2048, 3840,
] as const;

export const IMAGE_QUALITY = {
  /** Full-bleed LCP (hero poster). */
  hero: 90,
  /** First/large portfolio covers and modal stage. */
  feature: 90,
  /** Other portfolio cards, services, in-progress stages. */
  editorial: 85,
  /** Filmstrip / small UI. */
  thumb: 75,
} as const;

export const IMAGE_SIZES = {
  hero: "100vw",
  /**
   * Lead / span=large cards after the portrait-safe flex-basis
   * `min(42vw, 36rem)` at ≥1024px.
   */
  portfolioLead:
    "(max-width: 767px) 86vw, (max-width: 1023px) 72vw, min(42vw, 36rem)",
  /**
   * Default / wide cards: `min(38vw, 34rem)`.
   * Tall/small use the same string — it over-requests slightly, never under.
   */
  portfolioCard:
    "(max-width: 767px) 86vw, (max-width: 1023px) 72vw, min(38vw, 34rem)",
  /**
   * Dossier media column ≈ 1.65/2.5 of min(93vw, 1620px).
   * Portrait stills are contained; this is the stage box, not the decoded width.
   */
  dossierStage: "(max-width: 1023px) 100vw, min(58vw, 68rem)",
  /** 3.85rem thumbs (4.35rem ≥1440). */
  dossierThumb: "(min-width: 1440px) 70px, 62px",
  serviceInline: "(max-width: 1023px) 92vw, 40vw",
  serviceSticky: "(max-width: 1280px) 40vw, 560px",
  inProgressViewer: "(max-width: 1024px) 100vw, min(90vw, 1280px)",
} as const;
