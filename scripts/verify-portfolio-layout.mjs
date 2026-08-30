import assert from "node:assert/strict";
import { editorialCardSpan, editorialCardSpans } from "../lib/portfolio-layout.ts";

function periodRepeats(spans, period, minCycles = 2) {
  if (spans.length < period * minCycles) return false;
  for (let i = period; i < period * minCycles; i++) {
    if (spans[i] !== spans[i % period]) return false;
  }
  return true;
}

assert.equal(editorialCardSpan(0), "large");
assert.equal(editorialCardSpan(0, "small"), "large");
assert.equal(editorialCardSpan(0, "small", { useStoredOverride: true }), "small");

const one = editorialCardSpans(1);
assert.deepEqual(one, ["large"]);

const four = editorialCardSpans(4);
assert.deepEqual(four, ["large", "tall", "wide", "small"]);

const six = editorialCardSpans(6);
assert.equal(six[0], "large");
assert.ok(!(six[1] === "small" && six[2] === "large"));

const ten = editorialCardSpans(10);
assert.equal(ten.length, 10);
assert.equal(ten[0], "large");
assert.ok(!periodRepeats(ten, 2));
assert.ok(!periodRepeats(ten, 4));

const thirteen = editorialCardSpans(13);
assert.equal(thirteen.length, 13);
assert.ok(!periodRepeats(thirteen, 2));
assert.ok(!periodRepeats(thirteen, 4));

const twenty = editorialCardSpans(20);
assert.equal(twenty.length, 20);
assert.ok(!periodRepeats(twenty, 2));
assert.ok(!periodRepeats(twenty, 4));

const reorderA = editorialCardSpans(10);
const reorderB = editorialCardSpans(10);
assert.deepEqual(reorderA, reorderB);

console.log("portfolio layout ok", ten.join(" "));
