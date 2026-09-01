/**
 * Regression: homepage panel prefers previewVideo; viewer uses full video only.
 */
import { readFileSync } from "node:fs";
import { mapInProgressFrame } from "../lib/sanity/map-in-progress.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

const full = "https://cdn.sanity.io/files/x/y/full-1080.mp4";
const preview = "https://cdn.sanity.io/files/x/y/preview-720.mp4";

const withBoth = mapInProgressFrame({
  frameId: "perfect-life-60",
  mediaType: "video",
  src: "https://cdn.sanity.io/images/x/y/poster.jpg",
  video: full,
  previewVideo: preview,
});

assert("maps previewVideo", withBoth?.previewVideo === preview);
assert("maps full video", withBoth?.video === full);
assert("preview differs from full", withBoth?.previewVideo !== withBoth?.video);

const legacy = mapInProgressFrame({
  frameId: "legacy",
  mediaType: "video",
  video: full,
});

assert("legacy has no previewVideo", legacy?.previewVideo === undefined);
assert("legacy keeps full video", legacy?.video === full);

const panelSource = withBoth?.previewVideo ?? withBoth?.video;
assert("panel source prefers preview", panelSource === preview);

const viewerSource = withBoth?.video;
assert("viewer source is full only", viewerSource === full);

const legacyPanel = legacy?.previewVideo ?? legacy?.video;
assert("legacy panel falls back to video", legacyPanel === full);

const inProgressTsx = readFileSync(
  new URL("../components/sections/in-progress.tsx", import.meta.url),
  "utf8"
);
const viewerTsx = readFileSync(
  new URL("../components/sections/in-progress-viewer.tsx", import.meta.url),
  "utf8"
);

assert(
  "homepage uses previewVideo ?? video",
  inProgressTsx.includes("item.previewVideo ?? item.video")
);
assert(
  "viewer does not reference previewVideo",
  !viewerTsx.includes("previewVideo")
);
assert("viewer uses item.video", viewerTsx.includes("mp4={item.video}"));

const query = readFileSync(
  new URL("../lib/sanity/queries.ts", import.meta.url),
  "utf8"
);
assert(
  "GROQ selects previewVideo",
  query.includes('"previewVideo": previewVideo.asset->url')
);

if (failures.length) {
  console.error(
    "preview video source checks failed:\n" +
      failures.map((f) => `  - ${f}`).join("\n")
  );
  process.exit(1);
}

console.log("preview video source checks passed");
