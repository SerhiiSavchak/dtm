import {
  inProgressPosterPriority,
  isMobilePlaybackProfile,
  prefersSaveData,
  shouldAutoplayInProgressPanel,
  shouldAutoplayInProgressPanelForProfile,
  shouldLoadInProgressVideo,
  shouldLoadInProgressVideoForProfile,
} from "../lib/media/playback-policy.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

const base = {
  boardInView: true,
  boardNearView: true,
  panelIndex: 0,
  activeIndex: 0,
  reducedMotion: false,
  viewerOpen: false,
  saveData: false,
  mediaLive: true,
};

assert("desktop loads all near-view panels", shouldLoadInProgressVideo({ ...base, panelIndex: 2 }));
assert(
  "desktop autoplays all in-view",
  shouldAutoplayInProgressPanel({ ...base, panelIndex: 3 })
);

assert(
  "mobile loads only active panel",
  shouldLoadInProgressVideoForProfile({ ...base, panelIndex: 1, activeIndex: 0 }, true) === false &&
    shouldLoadInProgressVideoForProfile({ ...base, panelIndex: 0, activeIndex: 0 }, true) === true
);

assert(
  "mobile autoplays only active panel",
  shouldAutoplayInProgressPanelForProfile({ ...base, panelIndex: 2, activeIndex: 1 }, true) === false &&
    shouldAutoplayInProgressPanelForProfile({ ...base, panelIndex: 1, activeIndex: 1 }, true) === true
);

assert(
  "save-data blocks load and autoplay",
  !shouldLoadInProgressVideo({ ...base, saveData: true }) &&
    !shouldAutoplayInProgressPanel({ ...base, saveData: true })
);

assert(
  "viewer open pauses autoplay",
  !shouldAutoplayInProgressPanel({ ...base, viewerOpen: true })
);

assert(
  "far section blocks video load",
  !shouldLoadInProgressVideo({ ...base, boardNearView: false })
);

assert(
  "reduced motion blocks load",
  !shouldLoadInProgressVideo({ ...base, reducedMotion: true })
);

assert(
  "poster priority first panel only",
  inProgressPosterPriority(0, true) && !inProgressPosterPriority(1, true)
);

assert("isMobilePlaybackProfile is function", typeof isMobilePlaybackProfile === "function");
assert("prefersSaveData is function", typeof prefersSaveData === "function");

if (failures.length > 0) {
  console.error("playback policy failures:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log("playback policy checks passed");
