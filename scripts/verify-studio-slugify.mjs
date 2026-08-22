import assert from "node:assert/strict";
import { slugifyUa } from "../sanity/lib/slugify.ts";

assert.equal(slugifyUa("Кухня-вітальня"), "kukhnia-vitalnia");
assert.equal(slugifyUa("  Офіс  "), "ofis");
assert.ok(!slugifyUa("Кухня").includes(" "));

console.log("studio slugify ok");
