import {
  assembleInProgressRecord,
  compositionFromRecord,
  hardcodedInProgressRecord,
  isValidInProgressRecord,
  mapInProgressFrame,
  parseBoardIds,
  viewerIndexForFrame,
} from "../lib/sanity/map-in-progress.ts";
import { inProgressCompositionIds, inProgressMedia } from "../data/in-progress-scenes.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

const mapped = mapInProgressFrame({
  frameId: "kitchen-video",
  src: "https://cdn.sanity.io/images/x/y/poster.jpg",
  lqip: "data:image/jpeg;base64,aaa",
  video: "https://cdn.sanity.io/files/x/y/clip.mp4",
  objectPosition: "50% 42%",
});

assert("maps video frame", mapped?.id === "kitchen-video");
assert("keeps objectPosition", mapped?.objectPosition === "50% 42%");
assert("keeps video url", mapped?.video?.endsWith("clip.mp4") === true);
assert("rejects local still path", mapInProgressFrame({
  frameId: "x",
  src: "/images/foo.jpg",
}) === null);
assert("rejects local video path", mapInProgressFrame({
  frameId: "x",
  src: "https://cdn.sanity.io/images/x/y/a.jpg",
  video: "/videos/foo.mp4",
}) === null);

const frames = inProgressMedia.map((item, index) => ({
  ...item,
  src: `https://cdn.sanity.io/images/x/y/${index}.jpg`,
  video: item.video ? `https://cdn.sanity.io/files/x/y/${index}.mp4` : undefined,
}));

const boardIds = [...inProgressCompositionIds];
assert("hardcoded board is 4 unique", parseBoardIds({ boardIds })?.length === 4);
assert("valid record", isValidInProgressRecord(frames, boardIds) === true);
assert("invalid short board", isValidInProgressRecord(frames, boardIds.slice(0, 3)) === false);
assert(
  "invalid unknown board id",
  isValidInProgressRecord(frames, ["house-living", "house-bedroom", "house-vanity", "missing"]) === false
);

const assembled = assembleInProgressRecord(
  frames.map((item) => ({
    frameId: item.id,
    src: item.src,
    video: item.video,
    objectPosition: item.objectPosition,
  })),
  { boardIds }
);
assert("assemble succeeds", Boolean(assembled));
assert("assemble count", assembled?.frames.length === inProgressMedia.length);

const composition = compositionFromRecord(assembled);
assert("composition is 4", composition.length === 4);
assert("composition order is board order, not viewer order", composition[0]?.id === "house-living");
assert("second board slot is bedroom", composition[1]?.id === "house-bedroom");

assert(
  "click living opens viewer 0",
  viewerIndexForFrame(assembled.frames, "house-living") === 0
);
assert(
  "click bedroom opens viewer 4 not board 1",
  viewerIndexForFrame(assembled.frames, "house-bedroom") === 4
);
assert(
  "click vanity opens viewer 6 not board 2",
  viewerIndexForFrame(assembled.frames, "house-vanity") === 6
);
assert(
  "click kitchen opens viewer 9 not board 3",
  viewerIndexForFrame(assembled.frames, "kitchen-video") === 9
);

const fallback = hardcodedInProgressRecord();
assert("fallback keeps source count", fallback.frames.length === inProgressMedia.length);
assert(
  "fallback board matches source composition",
  fallback.boardIds.join() === inProgressCompositionIds.join()
);

if (failures.length) {
  console.error("in-progress map checks failed:\n" + failures.map((item) => `  - ${item}`).join("\n"));
  process.exit(1);
}
console.log("in-progress map checks passed");
