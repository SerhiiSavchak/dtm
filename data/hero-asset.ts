/**
 * Internal note for the Hero background video.
 *
 * This footage is licensed stock. It must never be labelled or implied
 * as a completed DTM project. It is the only photography/video exception
 * on the site.
 */
export const heroAssetNote = {
  status: "ready" as const,
  pageUrl: "https://www.pexels.com/video/video-of-a-luxurious-bathroom-7578551/",
  fileUrl:
    "https://videos.pexels.com/video-files/7578551/7578551-uhd_2560_1440_30fps.mp4",
  creator: "Kindel Media",
  licenceName: "Pexels License",
  licenceUrl: "https://www.pexels.com/license/",
  commercialUse: true,
  attributionRequired: false,
  source: {
    width: 2560,
    height: 1440,
    durationSec: 15.62,
    codec: "h264 + aac",
    bytes: 12507703,
  },
  delivered: {
    path: "/videos/hero-loop.mp4",
    width: 1920,
    height: 1080,
    durationSec: 12,
    codec: "h264",
    audio: false,
    faststart: true,
    crf: 22,
    bytes: 3628320,
    poster: "/images/hero-poster.jpg",
  },
  notes: [
    "Not a DTM project.",
    "Contemporary residential bathroom: white, light wood, warm mosaic, chrome.",
    "Slow pull-back; no people; no logos.",
    "Audio stripped. H.264 yuv420p +faststart. Desktop delivery 1920×1080.",
    "Rejected Mixkit #43033 (kitchen with food, 1280×720) and Pexels 3773486 (dated suburban interior).",
  ],
} as const;
