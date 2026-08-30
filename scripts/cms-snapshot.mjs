/**
 * Read-only published CMS snapshot. Never mutates Sanity.
 */
import { createClient } from "next-sanity";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildInProgressSnapshot,
  buildPortfolioSnapshot,
} from "../lib/sanity/snapshot-build.ts";
import {
  readJsonFile,
  replaceInProgressSnapshotIfValid,
  replacePortfolioSnapshotIfValid,
  writeJsonAtomic,
} from "../lib/sanity/snapshot-write.ts";
import {
  IN_PROGRESS_BOARD_QUERY,
  IN_PROGRESS_FRAMES_QUERY,
  PORTFOLIO_PROJECTS_QUERY,
} from "../lib/sanity/queries.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTFOLIO_PATH = path.join(ROOT, "data", "generated", "portfolio.snapshot.json");
const IN_PROGRESS_PATH = path.join(ROOT, "data", "generated", "in-progress.snapshot.json");

function hydrateEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function abort(message) {
  console.error(`\nABORT: ${message}\nExisting snapshot files were not overwritten.\n`);
  process.exit(1);
}

hydrateEnv();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
if (!projectId || !dataset) {
  abort("NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET are required.");
}
if (dataset !== "development") {
  if (process.env.ALLOW_NON_DEVELOPMENT_SNAPSHOT !== "1") {
    abort(
      `Refusing dataset ${JSON.stringify(dataset)}. Snapshots for last-known-good must come from "development" unless ALLOW_NON_DEVELOPMENT_SNAPSHOT=1.`
    );
  }
  console.warn(
    `[cms:snapshot] ALLOW_NON_DEVELOPMENT_SNAPSHOT=1 — reading ${dataset}`
  );
}

console.log(`[cms:snapshot] READ-ONLY fetch project=${projectId} dataset=${dataset}`);

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-08-22",
  useCdn: false,
  perspective: "published",
});

const generatedAt = new Date().toISOString();
const [docs, frames, board] = await Promise.all([
  client.fetch(PORTFOLIO_PROJECTS_QUERY),
  client.fetch(IN_PROGRESS_FRAMES_QUERY),
  client.fetch(IN_PROGRESS_BOARD_QUERY),
]);

const portfolio = buildPortfolioSnapshot(docs, { dataset, generatedAt });
if (!portfolio.ok) abort(portfolio.reason);

const inProgress = buildInProgressSnapshot(frames, board, { dataset, generatedAt });
if (!inProgress.ok) abort(inProgress.reason);

const beforePortfolio = readJsonFile(PORTFOLIO_PATH);

const writtenP = replacePortfolioSnapshotIfValid(PORTFOLIO_PATH, portfolio.file);
if (!writtenP.ok) abort(writtenP.reason);
const writtenI = replaceInProgressSnapshotIfValid(IN_PROGRESS_PATH, inProgress.file);
if (!writtenI.ok) {
  if (beforePortfolio != null) writeJsonAtomic(PORTFOLIO_PATH, beforePortfolio);
  abort(writtenI.reason);
}

console.log(`[cms:snapshot] portfolio ${portfolio.records.length} projects`);
console.log(
  `[cms:snapshot] order: ${portfolio.records.map((row) => row.slug).join(" → ")}`
);
console.log(
  `[cms:snapshot] in-progress frames=${inProgress.record.frames.length} board=${inProgress.record.boardIds.join(" → ")}`
);
console.log("[cms:snapshot] wrote data/generated/*.snapshot.json");
