import assert from "node:assert/strict";
import { publishedPortfolioOrFallback } from "../lib/sanity/get-portfolio.ts";
import { publishedInProgressOrFallback } from "../lib/sanity/get-in-progress.ts";
import { lastKnownGoodInProgress, lastKnownGoodPortfolio } from "../lib/sanity/last-known-good.ts";
import { assembleInProgressRecord } from "../lib/sanity/map-in-progress.ts";
import { mapSanityProject } from "../lib/sanity/map-project.ts";
import { projects } from "../data/projects.ts";
import { inProgressMedia } from "../data/in-progress-scenes.ts";

const lkgPortfolio = lastKnownGoodPortfolio();
const lkgInProgress = lastKnownGoodInProgress();

// Empty / failed Sanity → last-known-good (snapshot when valid), never a merge
const fallbackPortfolio = publishedPortfolioOrFallback([]);
assert.equal(fallbackPortfolio.length, lkgPortfolio.length);
assert.equal(fallbackPortfolio[0]?.slug, lkgPortfolio[0]?.slug);
assert.ok(fallbackPortfolio.every((p) => p.cover.includes("cdn.sanity.io") || p.cover.startsWith("/")));
// Current committed snapshot is valid CDN LKG — not mixed with local hardcoded paths
assert.ok(fallbackPortfolio[0]?.cover.includes("cdn.sanity.io"));

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
assert.notEqual(fromCms[0]?.slug, lkgPortfolio[0]?.slug);

const malformed = publishedPortfolioOrFallback(
  [mapSanityProject({ titleUa: "X", slug: "x", category: "house" })].filter(
    Boolean
  )
);
assert.equal(malformed.length, lkgPortfolio.length);
assert.equal(malformed[0]?.slug, lkgPortfolio[0]?.slug);

const emptyFrames = publishedInProgressOrFallback(
  assembleInProgressRecord([], { boardIds: ["a", "b", "c", "d"] })
);
assert.equal(emptyFrames.frames.length, lkgInProgress.frames.length);
assert.equal(emptyFrames.boardIds.join(), lkgInProgress.boardIds.join());

const mixedInvalid = publishedInProgressOrFallback(null);
assert.equal(mixedInvalid.boardIds.length, 4);
assert.equal(mixedInvalid.boardIds.join(), lkgInProgress.boardIds.join());

function simulateFetchFailure() {
  try {
    throw new Error("timeout-like rejection");
  } catch {
    return publishedPortfolioOrFallback([]);
  }
}
const timedOut = simulateFetchFailure();
assert.equal(timedOut.length, lkgPortfolio.length);
assert.equal(timedOut[0]?.slug, lkgPortfolio[0]?.slug);

const empty = publishedPortfolioOrFallback([]);
assert.equal(empty.length, lkgPortfolio.length);

const allBad = publishedPortfolioOrFallback(
  [
    mapSanityProject({ titleUa: "X", slug: "x", category: "house" }),
    mapSanityProject({ titleUa: "Y", slug: "y", category: "apartment" }),
  ].filter(Boolean)
);
assert.equal(allBad.length, lkgPortfolio.length);

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
assert.equal(simulateInProgressThrow().frames.length, lkgInProgress.frames.length);

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
  lkgInProgress.frames.length
);
assert.equal(
  publishedInProgressOrFallback(
    assembleInProgressRecord(null, {
      boardIds: ["a", "b", "c", "d", "e"],
    })
  ).frames.length,
  lkgInProgress.frames.length
);
assert.equal(
  publishedInProgressOrFallback(
    assembleInProgressRecord(null, { boardIds: ["a", "a", "b", "c"] })
  ).frames.length,
  lkgInProgress.frames.length
);

// Hardcoded demo remains available as tertiary source identity (distinct from CDN LKG when both exist)
assert.equal(projects.length > 0, true);
assert.equal(inProgressMedia.length > 0, true);
assert.ok(projects[0]?.cover.startsWith("/") || projects[0]?.cover.startsWith("http"));

console.log("sanity fallback ok");
