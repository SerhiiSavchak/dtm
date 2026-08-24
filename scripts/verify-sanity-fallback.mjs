import assert from "node:assert/strict";
import { publishedPortfolioOrFallback } from "../lib/sanity/get-portfolio.ts";
import { publishedInProgressOrFallback } from "../lib/sanity/get-in-progress.ts";
import { assembleInProgressRecord } from "../lib/sanity/map-in-progress.ts";
import { mapSanityProject } from "../lib/sanity/map-project.ts";
import { projects } from "../data/projects.ts";
import { inProgressMedia } from "../data/in-progress-scenes.ts";

const fallbackPortfolio = publishedPortfolioOrFallback([]);
assert.equal(fallbackPortfolio.length, projects.length);
assert.equal(fallbackPortfolio[0]?.slug, projects[0]?.slug);

const valid = mapSanityProject({
  titleUa: "CMS",
  slug: "cms",
  category: "house",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
});
assert.ok(valid);
const fromCms = publishedPortfolioOrFallback([valid]);
assert.equal(fromCms.length, 1);
assert.equal(fromCms[0]?.slug, "cms");
assert.notEqual(fromCms[0]?.slug, projects[0]?.slug);

const malformed = publishedPortfolioOrFallback(
  [mapSanityProject({ titleUa: "X", slug: "x", category: "house" })].filter(
    Boolean
  )
);
assert.equal(malformed.length, projects.length);

const emptyFrames = publishedInProgressOrFallback(
  assembleInProgressRecord([], { boardIds: ["a", "b", "c", "d"] })
);
assert.equal(emptyFrames.frames.length, inProgressMedia.length);

const mixedInvalid = publishedInProgressOrFallback(null);
assert.equal(mixedInvalid.boardIds.length, 4);

function simulateFetchFailure() {
  try {
    throw new Error("timeout-like rejection");
  } catch {
    return publishedPortfolioOrFallback([]);
  }
}
const timedOut = simulateFetchFailure();
assert.equal(timedOut.length, projects.length);
assert.equal(timedOut[0]?.slug, projects[0]?.slug);

const empty = publishedPortfolioOrFallback([]);
assert.equal(empty.length, projects.length);

const allBad = publishedPortfolioOrFallback(
  [
    mapSanityProject({ titleUa: "X", slug: "x", category: "house" }),
    mapSanityProject({ titleUa: "Y", slug: "y", category: "apartment" }),
  ].filter(Boolean)
);
assert.equal(allBad.length, projects.length);

const oneGood = mapSanityProject({
  titleUa: "CMS-OK",
  slug: "cms-ok",
  category: "house",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
});
const partial = publishedPortfolioOrFallback(
  [oneGood, mapSanityProject({ titleUa: "bad", slug: "bad", category: "house" })].filter(
    Boolean
  )
);
assert.equal(partial.length, 1);
assert.equal(partial[0]?.slug, "cms-ok");

function simulateInProgressThrow() {
  try {
    throw new Error("in-progress fetch failed");
  } catch {
    return publishedInProgressOrFallback(null);
  }
}
assert.equal(simulateInProgressThrow().frames.length, inProgressMedia.length);

assert.equal(
  publishedInProgressOrFallback(
    assembleInProgressRecord([], { boardIds: ["a", "b", "c", "d"] })
  ).boardIds.length,
  4
);
assert.equal(
  publishedInProgressOrFallback(
    assembleInProgressRecord(null, { boardIds: ["a"] })
  ).frames.length,
  inProgressMedia.length
);
assert.equal(
  publishedInProgressOrFallback(
    assembleInProgressRecord(null, {
      boardIds: ["a", "b", "c", "d", "e"],
    })
  ).frames.length,
  inProgressMedia.length
);
assert.equal(
  publishedInProgressOrFallback(
    assembleInProgressRecord(null, { boardIds: ["a", "a", "b", "c"] })
  ).frames.length,
  inProgressMedia.length
);

console.log("sanity fallback ok");
