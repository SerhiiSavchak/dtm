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

assert("maps video-only frame", mapInProgressFrame({
  frameId: "clip-a",
  mediaType: "video",
  video: "https://cdn.sanity.io/files/x/y/clip.mp4",
  objectPosition: "center center",
})?.video?.endsWith("clip.mp4") === true);
assert("video-only has no src", mapInProgressFrame({
  frameId: "clip-a",
  mediaType: "video",
  video: "https://cdn.sanity.io/files/x/y/clip.mp4",
})?.src === undefined);
assert("maps video with optional poster", mapInProgressFrame({
  frameId: "clip-b",
  mediaType: "video",
  src: "https://cdn.sanity.io/images/x/y/poster.jpg",
  video: "https://cdn.sanity.io/files/x/y/clip.mp4",
})?.src?.endsWith("poster.jpg") === true);
assert("rejects photo without still", mapInProgressFrame({
  frameId: "photo-a",
  mediaType: "photo",
}) === null);
assert("rejects empty frame", mapInProgressFrame({
  frameId: "empty",
}) === null);
assert("rejects video without file", mapInProgressFrame({
  frameId: "bad-video",
  mediaType: "video",
}) === null);

assert(
  "maps optional title and area",
  mapInProgressFrame({
    frameId: "clip-meta",
    mediaType: "video",
    titleUa: "ЖК Perfect Life",
    titleEn: "Perfect Life",
    area: 60,
    video: "https://cdn.sanity.io/files/x/y/clip.mp4",
  })?.titleUa === "ЖК Perfect Life" &&
    mapInProgressFrame({
      frameId: "clip-meta",
      mediaType: "video",
      titleUa: "ЖК Perfect Life",
      area: 60,
      video: "https://cdn.sanity.io/files/x/y/clip.mp4",
    })?.area === 60
);
assert(
  "legacy without title still maps",
  mapInProgressFrame({
    frameId: "legacy",
    mediaType: "video",
    video: "https://cdn.sanity.io/files/x/y/clip.mp4",
  })?.titleUa === undefined
);
assert(
  "rejects zero/negative area",
  mapInProgressFrame({
    frameId: "clip-zero",
    mediaType: "video",
    area: 0,
    video: "https://cdn.sanity.io/files/x/y/clip.mp4",
  })?.area === undefined
);

const frames = inProgressMedia.map((item, index) => ({
  ...item,
  src: `https://cdn.sanity.io/images/x/y/${index}.jpg`,
  video: item.video ? `https://cdn.sanity.io/files/x/y/${index}.mp4` : undefined,
}));

const boardIds = [...inProgressCompositionIds];
assert(
  "invalid zero board ids",
  parseBoardIds({ boardIds: [] }) === null
);
assert(
  "invalid one board id",
  parseBoardIds({ boardIds: ["house-living"] }) === null
);
assert("valid record", isValidInProgressRecord(frames, boardIds) === true);
assert("invalid short board", isValidInProgressRecord(frames, boardIds.slice(0, 3)) === false);
assert(
  "invalid five board ids",
  parseBoardIds({ boardIds: [...boardIds, "extra"] }) === null
);
assert(
  "duplicate board refs invalid",
  parseBoardIds({
    boardIds: ["house-living", "house-bedroom", "house-vanity", "house-living"],
  }) === null
);
assert(
  "assemble null when board missing frame",
  assembleInProgressRecord(
    frames.map((item) => ({
      frameId: item.id,
      src: item.src,
      video: item.video,
      objectPosition: item.objectPosition,
    })),
    { boardIds: ["house-living", "house-bedroom", "house-vanity", "missing"] }
  ) === null
);
assert(
  "assemble null when docs empty",
  assembleInProgressRecord([], { boardIds }) === null
);
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
