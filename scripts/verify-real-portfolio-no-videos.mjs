/**
 * Regression: the seven real Portfolio projects must have zero gallery video refs.
 * Queries development published Sanity only (read-only).
 */
import { createClient } from "next-sanity";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REAL_PORTFOLIO_PROJECTS } from "./real-portfolio-projects.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REAL_IDS = REAL_PORTFOLIO_PROJECTS.map((p) => `dtm-real-project-${p.idKey}`);

function loadEnvLocal() {
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

loadEnvLocal();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "development";

if (!projectId) {
  console.error("ABORT: NEXT_PUBLIC_SANITY_PROJECT_ID is missing.");
  process.exit(1);
}

if (dataset !== "development") {
  console.error(
    `ABORT: expected development dataset for real-portfolio video audit, got ${JSON.stringify(dataset)}.`
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-08-22",
  useCdn: false,
  perspective: "published",
});

const rows = await client.fetch(
  `*[_id in $ids]{
    _id,
    titleUa,
    "slug": slug.current,
    "videos": gallery[defined(video.asset)]{
      _key,
      "videoUrl": video.asset->url
    }
  }`,
  { ids: REAL_IDS }
);

const failures = [];

if (rows.length !== REAL_IDS.length) {
  const found = new Set(rows.map((r) => r._id));
  for (const id of REAL_IDS) {
    if (!found.has(id)) failures.push(`missing project document: ${id}`);
  }
}

for (const row of rows) {
  const count = row.videos?.length ?? 0;
  if (count !== 0) {
    failures.push(
      `${row._id} (${row.titleUa}): ${count} video ref(s) — ${row.videos.map((v) => v.videoUrl).join(", ")}`
    );
  }
}

if (failures.length > 0) {
  console.error("FAIL: real Portfolio projects must have zero video refs:\n");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `PASS: all ${REAL_IDS.length} real Portfolio projects have zero gallery video refs (dataset=${dataset}).`
);
