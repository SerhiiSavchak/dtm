import { useStageCrossfade, STAGE_LOADER_DELAY_MS } from "../lib/media/stage-crossfade.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

assert("loader delay is positive", STAGE_LOADER_DELAY_MS >= 100);
assert("useStageCrossfade exported", typeof useStageCrossfade === "function");

if (failures.length) {
  console.error("media stage checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("media stage checks passed");
