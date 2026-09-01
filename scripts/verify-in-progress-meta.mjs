import assert from "node:assert/strict";
import {
  formatInProgressArea,
  formatInProgressViewerMeta,
  resolveInProgressTitle,
} from "../lib/in-progress-meta.ts";
import { compositionFromRecord } from "../lib/sanity/map-in-progress.ts";

assert.equal(formatInProgressArea(60, "uk"), "60\u00A0м²");
assert.equal(formatInProgressArea(100, "uk"), "100\u00A0м²");
assert.equal(formatInProgressArea(90, "en"), "90\u00A0m²");
assert.equal(formatInProgressArea(undefined, "uk"), null);
assert.equal(formatInProgressArea(null, "uk"), null);
assert.equal(formatInProgressArea(0, "uk"), null);
assert.equal(formatInProgressArea(-5, "uk"), null);

assert.equal(
  resolveInProgressTitle({ titleUa: "ЖК MS", titleEn: "MS Residence" }, "uk"),
  "ЖК MS"
);
assert.equal(
  resolveInProgressTitle({ titleUa: "ЖК MS", titleEn: "MS Residence" }, "en"),
  "MS Residence"
);
assert.equal(
  resolveInProgressTitle({ titleUa: "ЖК MS" }, "en"),
  "ЖК MS"
);
assert.equal(resolveInProgressTitle({}, "uk"), null);

assert.equal(
  formatInProgressViewerMeta(
    { titleUa: "ЖК Perfect Life", area: 60 },
    "uk"
  ),
  "ЖК Perfect Life · 60\u00A0м²"
);
assert.equal(
  formatInProgressViewerMeta({ titleUa: "ЖК Perfect Life" }, "uk"),
  "ЖК Perfect Life"
);
assert.equal(formatInProgressViewerMeta({}, "uk"), null);

const composition = compositionFromRecord({
  frames: [
    { id: "a", objectPosition: "center", panel: "video", titleUa: "A" },
    { id: "b", objectPosition: "center", panel: "video", titleUa: "B" },
    { id: "c", objectPosition: "center", panel: "video", titleUa: "C" },
    { id: "d", objectPosition: "center", panel: "video", titleUa: "D" },
  ],
  boardIds: ["d", "b", "a", "c"],
});
assert.deepEqual(
  composition.map((item) => item.titleUa),
  ["D", "B", "A", "C"]
);

console.log("in-progress meta checks passed");
