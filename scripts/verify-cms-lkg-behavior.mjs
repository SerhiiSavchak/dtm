/**
 * LKG must preserve behavior fields (including span). Fallbacks never mix
 * live / last-known-good / hardcoded demo.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projects as hardcodedProjects } from "../data/projects.ts";
import { CMS_SPAN_ENUM } from "../lib/cms/field-contract.ts";
import { portfolioCardLayout } from "../lib/portfolio-layout.ts";
import { publishedInProgressOrFallback } from "../lib/sanity/get-in-progress.ts";
import { publishedPortfolioOrFallback } from "../lib/sanity/get-portfolio.ts";
import {
  lastKnownGoodInProgress,
  lastKnownGoodPortfolio,
} from "../lib/sanity/last-known-good.ts";
import { hardcodedToRecord, mapSanityProject } from "../lib/sanity/map-project.ts";
import {
  isValidInProgressSnapshot,
  isValidPortfolioSnapshot,
} from "../lib/sanity/snapshot.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portfolioFile = JSON.parse(
  readFileSync(path.join(ROOT, "data", "generated", "portfolio.snapshot.json"), "utf8")
);
const inProgressFile = JSON.parse(
  readFileSync(path.join(ROOT, "data", "generated", "in-progress.snapshot.json"), "utf8")
);

assert.equal(isValidPortfolioSnapshot(portfolioFile), true);
assert.equal(isValidInProgressSnapshot(inProgressFile), true);

const lkg = lastKnownGoodPortfolio();
assert.equal(lkg.length, 7);
assert.equal(lkg.length, portfolioFile.projects.length);

for (const project of lkg) {
  assert.ok(CMS_SPAN_ENUM.includes(project.span), `${project.slug} LKG span`);
  assert.ok(project.coverPosition.trim().length > 0, `${project.slug} LKG coverPosition`);
  assert.ok(project.media.length > 0, `${project.slug} LKG media`);
  for (const item of project.media) {
    assert.ok(item.fit === "contain" || item.fit === "cover");
    assert.ok(item.objectPosition);
    assert.equal(item.video, undefined);
  }
  const layout = portfolioCardLayout(project.span);
  assert.equal(layout.dataSpan, project.span);
}

const spans = new Set(lkg.map((project) => project.span));
assert.ok(spans.has("tall"), "production LKG includes a non-small span (escaped-bug witness)");

const live = mapSanityProject({
  titleUa: "Live",
  slug: "live-only",
  category: "house",
  span: "wide",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg", fit: "contain" }],
});
assert.ok(live);
const fromLive = publishedPortfolioOrFallback([live]);
assert.equal(fromLive.length, 1);
assert.equal(fromLive[0].slug, "live-only");
assert.equal(fromLive[0].span, "wide");
assert.equal(
  fromLive.some((project) => lkg.some((item) => item.slug === project.slug)),
  false,
  "live payload must not mix LKG slugs"
);

const fromDown = publishedPortfolioOrFallback([]);
assert.deepEqual(
  fromDown.map((project) => ({ slug: project.slug, span: project.span })),
  lkg.map((project) => ({ slug: project.slug, span: project.span }))
);
assert.equal(
  fromDown.every((project) => project.cover.includes("cdn.sanity.io")),
  true,
  "Sanity-down LKG must preserve CDN media, not demo paths"
);

const hardcoded = hardcodedProjects.map(hardcodedToRecord);
const lkgSlugs = new Set(lkg.map((project) => project.slug));
assert.equal(
  fromDown.some((project) => project.cover.startsWith("/") && lkgSlugs.has(project.slug)),
  false
);
assert.equal(
  hardcoded.some((project) => project.cover.startsWith("/")),
  true,
  "hardcoded demo remains a distinct tertiary source"
);

const missingSpanSnapshot = {
  ...portfolioFile,
  projects: portfolioFile.projects.map((project, index) =>
    index === 0 ? { ...project, span: undefined } : project
  ),
};
assert.equal(isValidPortfolioSnapshot(missingSpanSnapshot), false);

const ip = lastKnownGoodInProgress();
assert.equal(ip.boardIds.length, 4);
assert.equal(publishedInProgressOrFallback(null).boardIds.join(), ip.boardIds.join());
for (const frame of ip.frames) {
  assert.ok(frame.objectPosition);
  assert.ok(frame.video);
  assert.ok(frame.previewVideo);
  assert.notEqual(frame.previewVideo, frame.video);
  assert.ok(frame.titleUa);
  assert.ok(frame.area);
}

const liveBoard = {
  frames: ip.frames,
  boardIds: [...ip.boardIds].reverse(),
};
const liveIp = publishedInProgressOrFallback(liveBoard);
assert.deepEqual(liveIp.boardIds, liveBoard.boardIds);
assert.notDeepEqual(liveIp.boardIds, ip.boardIds);

console.log("cms lkg behavior ok");
