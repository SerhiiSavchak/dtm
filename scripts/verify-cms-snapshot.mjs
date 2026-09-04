import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { buildInProgressSnapshot, buildPortfolioSnapshot } from "../lib/sanity/snapshot-build.ts";
import {
  isValidInProgressSnapshot,
  isValidPortfolioSnapshot,
} from "../lib/sanity/snapshot.ts";
import {
  readJsonFile,
  replaceInProgressSnapshotIfValid,
  replacePortfolioSnapshotIfValid,
} from "../lib/sanity/snapshot-write.ts";
import { publishedInProgressOrFallback } from "../lib/sanity/get-in-progress.ts";
import { publishedPortfolioOrFallback } from "../lib/sanity/get-portfolio.ts";
import { lastKnownGoodInProgress, lastKnownGoodPortfolio } from "../lib/sanity/last-known-good.ts";
import { assembleInProgressRecord } from "../lib/sanity/map-in-progress.ts";
import { mapSanityProject } from "../lib/sanity/map-project.ts";
import { hardcodedInProgressRecord } from "../lib/sanity/map-in-progress.ts";
import { hardcodedToRecord } from "../lib/sanity/map-project.ts";
import { projects } from "../data/projects.ts";
import { inProgressMedia } from "../data/in-progress-scenes.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTFOLIO_PATH = path.join(ROOT, "data", "generated", "portfolio.snapshot.json");
const IN_PROGRESS_PATH = path.join(ROOT, "data", "generated", "in-progress.snapshot.json");

const validDoc = {
  titleUa: "CMS",
  slug: "cms-snap",
  category: "house",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg", fit: "contain" }],
};

const meta = { dataset: "development", generatedAt: "2026-08-24T00:00:00.000Z" };

const built = buildPortfolioSnapshot([validDoc, { ...validDoc, slug: "cms-snap-2", titleUa: "B" }], meta);
assert.equal(built.ok, true);
if (built.ok) {
  assert.equal(built.records.length, 2);
  assert.equal(built.file.projects[0]?.slug, "cms-snap");
}

const empty = buildPortfolioSnapshot([], meta);
assert.equal(empty.ok, false);

const malformed = buildPortfolioSnapshot(
  [{ titleUa: "X", slug: "x", category: "house" }],
  meta
);
assert.equal(malformed.ok, false);

const mixed = buildPortfolioSnapshot(
  [validDoc, { titleUa: "bad", slug: "bad", category: "house" }],
  meta
);
assert.equal(mixed.ok, false);

const frames = [
  {
    frameId: "a",
    src: "https://cdn.sanity.io/images/x/y/a.jpg",
    objectPosition: "center center",
  },
  {
    frameId: "b",
    src: "https://cdn.sanity.io/images/x/y/b.jpg",
  },
  {
    frameId: "c",
    src: "https://cdn.sanity.io/images/x/y/c.jpg",
  },
  {
    frameId: "d",
    src: "https://cdn.sanity.io/images/x/y/d.jpg",
  },
];

const ipOk = buildInProgressSnapshot(frames, { boardIds: ["a", "b", "c", "d"] }, meta);
assert.equal(ipOk.ok, true);

assert.equal(buildInProgressSnapshot([], { boardIds: ["a", "b", "c", "d"] }, meta).ok, false);
assert.equal(buildInProgressSnapshot(frames, null, meta).ok, false);
assert.equal(
  buildInProgressSnapshot(frames, { boardIds: ["a", "b", "c", "a"] }, meta).ok,
  false
);

const dir = path.join(os.tmpdir(), `dtm-snap-${process.pid}`);
mkdirSync(dir, { recursive: true });
const target = path.join(dir, "portfolio.snapshot.json");
writeFileSync(
  target,
  JSON.stringify({
    version: 1,
    generatedAt: "old",
    dataset: "development",
    projects: [
      {
        slug: "keep-me",
        titleUa: "Keep",
        cover: "https://cdn.sanity.io/images/x/y/k.jpg",
        media: [
          {
            src: "https://cdn.sanity.io/images/x/y/k.jpg",
            fit: "contain",
            objectPosition: "center",
          },
        ],
      },
    ],
  }),
  "utf8"
);
const before = readFileSync(target, "utf8");
const refused = replacePortfolioSnapshotIfValid(target, {
  version: 1,
  generatedAt: meta.generatedAt,
  dataset: "development",
  projects: [],
});
assert.equal(refused.ok, false);
assert.equal(readFileSync(target, "utf8"), before);
assert.equal(readJsonFile(target).projects[0].slug, "keep-me");

// Atomic protection on real last-known-good files (refuse empty / bad version; no overwrite)
const realPortfolioBefore = readFileSync(PORTFOLIO_PATH, "utf8");
const realInProgressBefore = readFileSync(IN_PROGRESS_PATH, "utf8");
assert.equal(
  replacePortfolioSnapshotIfValid(PORTFOLIO_PATH, {
    version: 1,
    generatedAt: meta.generatedAt,
    dataset: "development",
    projects: [],
  }).ok,
  false
);
assert.equal(
  replacePortfolioSnapshotIfValid(PORTFOLIO_PATH, {
    version: 99,
    generatedAt: meta.generatedAt,
    dataset: "development",
    projects: built.ok ? built.file.projects : [],
  }).ok,
  false
);
assert.equal(
  replaceInProgressSnapshotIfValid(IN_PROGRESS_PATH, {
    version: 1,
    generatedAt: meta.generatedAt,
    dataset: "development",
    frames: [],
    boardIds: ["a", "b", "c", "d"],
  }).ok,
  false
);
assert.equal(readFileSync(PORTFOLIO_PATH, "utf8"), realPortfolioBefore);
assert.equal(readFileSync(IN_PROGRESS_PATH, "utf8"), realInProgressBefore);

// Invalid / wrong-version snapshot → reject → hardcoded (never mix)
const hardcodedPortfolio = projects.map(hardcodedToRecord);
const hardcodedInProgress = hardcodedInProgressRecord();

function portfolioFromSnapshotCandidate(candidate) {
  return isValidPortfolioSnapshot(candidate)
    ? candidate.projects
    : hardcodedPortfolio;
}
function inProgressFromSnapshotCandidate(candidate) {
  return isValidInProgressSnapshot(candidate)
    ? { frames: candidate.frames, boardIds: candidate.boardIds }
    : hardcodedInProgress;
}

assert.equal(isValidPortfolioSnapshot({ version: 99, projects: [{ slug: "x" }] }), false);
assert.equal(
  portfolioFromSnapshotCandidate({
    version: 99,
    generatedAt: meta.generatedAt,
    dataset: "development",
    projects: hardcodedPortfolio,
  })[0]?.slug,
  hardcodedPortfolio[0]?.slug
);
assert.equal(
  portfolioFromSnapshotCandidate({
    version: 1,
    generatedAt: meta.generatedAt,
    dataset: "development",
    projects: [{ slug: "broken" }],
  })[0]?.cover?.startsWith("/"),
  true
);
assert.equal(
  isValidInProgressSnapshot({
    version: 1,
    frames: [{ id: "a", src: "https://cdn.sanity.io/x.jpg" }],
    boardIds: ["a", "b", "c", "d"],
  }),
  false
);
assert.equal(
  inProgressFromSnapshotCandidate({
    version: 1,
    generatedAt: meta.generatedAt,
    dataset: "development",
    frames: [{ id: "a", src: "https://cdn.sanity.io/x.jpg" }],
    boardIds: ["a", "b", "c", "d"],
  }).boardIds.join(),
  hardcodedInProgress.boardIds.join()
);
assert.equal(
  inProgressFromSnapshotCandidate({
    version: 2,
    generatedAt: meta.generatedAt,
    dataset: "development",
    frames: hardcodedInProgress.frames,
    boardIds: hardcodedInProgress.boardIds,
  }).frames[0]?.src?.startsWith("/"),
  true
);

const mapped = mapSanityProject(validDoc);
assert.ok(mapped);
const fromCms = publishedPortfolioOrFallback([mapped]);
assert.equal(fromCms.length, 1);
assert.equal(fromCms[0]?.slug, "cms-snap");

const fallback = publishedPortfolioOrFallback([]);
const lkg = lastKnownGoodPortfolio();
assert.equal(fallback.length, lkg.length);
assert.equal(fallback[0]?.slug, lkg[0]?.slug);
assert.ok(lkg[0]?.cover?.includes("cdn.sanity.io"));
assert.notEqual(fromCms[0]?.slug, fallback[0]?.slug);

const ipFallback = publishedInProgressOrFallback(null);
const ipLkg = lastKnownGoodInProgress();
assert.equal(ipFallback.boardIds.join(), ipLkg.boardIds.join());
assert.equal(ipLkg.boardIds.length, 4);
assert.ok(ipLkg.frames.some((f) => f.src.includes("cdn.sanity.io")));
assert.equal(
  publishedInProgressOrFallback(assembleInProgressRecord(frames, { boardIds: ["a", "b", "c", "d"] }))
    .frames.length,
  4
);

assert.equal(projects.length > 0, true);
assert.equal(inProgressMedia.length > 0, true);

const generatedPortfolio = JSON.parse(readFileSync(PORTFOLIO_PATH, "utf8"));
const generatedInProgress = JSON.parse(readFileSync(IN_PROGRESS_PATH, "utf8"));
assert.equal(generatedPortfolio.dataset, "production");
assert.equal(generatedPortfolio.projects.length, 7);
assert.equal(generatedPortfolio.projects[0]?.slug, "private-house-sokilnyky");
assert.equal(
  generatedPortfolio.projects.some((p) => p.slug === "interior-living"),
  false
);
assert.equal(
  generatedPortfolio.projects.every(
    (p) => !p.media?.some((m) => m.video)
  ),
  true
);
assert.equal(generatedInProgress.dataset, "production");
assert.equal(generatedInProgress.frames.length, 4);
assert.equal(
  generatedInProgress.boardIds.join(),
  "perfect-life-60,huge-lux-90,natsionalnyi-70,ms-100"
);
for (const frame of generatedInProgress.frames) {
  assert.ok(frame.video, `${frame.id} missing full video in LKG`);
  assert.ok(frame.previewVideo, `${frame.id} missing previewVideo in LKG`);
  assert.notEqual(frame.previewVideo, frame.video);
  assert.ok(frame.src, `${frame.id} missing poster in LKG`);
}
assert.equal(
  generatedInProgress.frames.some((f) => f.id === "house-living" || f.id === "kitchen-video"),
  false
);

rmSync(dir, { recursive: true, force: true });
console.log("cms snapshot checks passed");
