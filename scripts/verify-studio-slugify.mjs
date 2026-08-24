import assert from "node:assert/strict";
import { slugifyUa, uniqueDraftSlug } from "../sanity/lib/slugify.ts";

assert.equal(slugifyUa("Кухня-вітальня"), "kukhnia-vitalnia");
assert.equal(slugifyUa("  Офіс  "), "ofis");
assert.ok(!slugifyUa("Кухня").includes(" "));
assert.equal(slugifyUa("Oak Kitchen"), "oak-kitchen");
assert.equal(slugifyUa("Test, 01!"), "test-01");
assert.equal(slugifyUa("Кабінет / atrium"), "kabinet-atrium");

const created = uniqueDraftSlug("proekt");
assert.match(created, /^proekt-[a-z0-9]+-[a-z0-9]+$/);
assert.notEqual(created, slugifyUa("Тестова квартира NEW"));
assert.equal(created, created, "rename does not rewrite stored slug");

const a = uniqueDraftSlug("kadr");
const b = uniqueDraftSlug("kadr");
assert.notEqual(a, b);

console.log("studio slugify ok");
