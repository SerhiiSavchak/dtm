/**
 * Conceptual proof of tagged cache + on-demand invalidation.
 * Simulates Next.js Data Cache semantics without booting Next.
 */
import assert from "node:assert/strict";
import { SANITY_CACHE_TAGS } from "../lib/sanity/cache-tags.ts";

const store = new Map();

function taggedFetch(tag, readSource) {
  const entry = store.get(tag);
  if (entry && !entry.stale) return entry.value;
  const value = readSource();
  store.set(tag, { value, stale: false });
  return value;
}

function revalidateTag(tag) {
  const entry = store.get(tag);
  if (entry) entry.stale = true;
}

let portfolioSource = "portfolio-v1";
let inProgressSource = "in-progress-v1";

// A — initial cached reads
const portfolioA = taggedFetch(SANITY_CACHE_TAGS.portfolio, () => portfolioSource);
const inProgressA = taggedFetch(SANITY_CACHE_TAGS.inProgress, () => inProgressSource);
assert.equal(portfolioA, "portfolio-v1");
assert.equal(inProgressA, "in-progress-v1");

// B — underlying CMS content changes
portfolioSource = "portfolio-v2";
inProgressSource = "in-progress-v2";

// C — without revalidation, cached values remain
const portfolioC = taggedFetch(SANITY_CACHE_TAGS.portfolio, () => portfolioSource);
const inProgressC = taggedFetch(SANITY_CACHE_TAGS.inProgress, () => inProgressSource);
assert.equal(portfolioC, "portfolio-v1");
assert.equal(inProgressC, "in-progress-v1");

// D — webhook invalidates only portfolio
revalidateTag(SANITY_CACHE_TAGS.portfolio);

// E — next reads: portfolio fresh, in-progress still stale until its tag fires
const portfolioE = taggedFetch(SANITY_CACHE_TAGS.portfolio, () => portfolioSource);
const inProgressE = taggedFetch(SANITY_CACHE_TAGS.inProgress, () => inProgressSource);
assert.equal(portfolioE, "portfolio-v2");
assert.equal(inProgressE, "in-progress-v1");

revalidateTag(SANITY_CACHE_TAGS.inProgress);
const inProgressF = taggedFetch(SANITY_CACHE_TAGS.inProgress, () => inProgressSource);
assert.equal(inProgressF, "in-progress-v2");

let spanSource = { slug: "private-house-sokilnyky", span: "tall" };
const spanCold = taggedFetch("sanity-portfolio-span", () => ({ ...spanSource }));
assert.equal(spanCold.span, "tall");
spanSource = { slug: "private-house-sokilnyky", span: "large" };
const spanWarmStale = taggedFetch("sanity-portfolio-span", () => ({ ...spanSource }));
assert.equal(spanWarmStale.span, "tall", "warm cache must not show unpublished span");
const httpAck = { ok: true, status: 200, revalidated: [SANITY_CACHE_TAGS.portfolio] };
assert.equal(httpAck.status, 200);
const spanAfterHttpOnly = taggedFetch("sanity-portfolio-span", () => ({ ...spanSource }));
assert.equal(
  spanAfterHttpOnly.span,
  "tall",
  "HTTP 200 acknowledgement without tag invalidation is not a frontend update"
);
revalidateTag("sanity-portfolio-span");
const spanRapidB = taggedFetch("sanity-portfolio-span", () => ({ ...spanSource }));
assert.equal(spanRapidB.span, "large");
spanSource = { slug: "private-house-sokilnyky", span: "small" };
revalidateTag("sanity-portfolio-span");
const spanRapidC = taggedFetch("sanity-portfolio-span", () => ({ ...spanSource }));
assert.equal(spanRapidC.span, "small");
spanSource = { slug: "private-house-sokilnyky", span: "tall" };
revalidateTag("sanity-portfolio-span");
const spanBackA = taggedFetch("sanity-portfolio-span", () => ({ ...spanSource }));
assert.equal(spanBackA.span, "tall");

console.log("cms cache flow checks passed");
