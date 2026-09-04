/**
 * Production READ-ONLY audit. Never mutates Sanity.
 * Compares frozen LKG CMS span vs public HTML data-span when reachable.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "tmp");
const PRODUCTION_ORIGIN = "https://www.dtm.lviv.ua";

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

const lkg = JSON.parse(
  readFileSync(path.join(ROOT, "data", "generated", "portfolio.snapshot.json"), "utf8")
);

const cmsRows = lkg.projects.map((project) => ({
  slug: project.slug,
  cmsSpan: project.span,
  titleUa: project.titleUa,
  coverPosition: project.coverPosition,
}));

function parseCards(html) {
  const cards = [];
  const re =
    /data-project="([^"]+)"[^>]*data-span="([^"]+)"|data-span="([^"]+)"[^>]*data-project="([^"]+)"/g;
  let match;
  while ((match = re.exec(html))) {
    if (match[1]) cards.push({ slug: match[1], span: match[2] });
    else cards.push({ slug: match[4], span: match[3] });
  }
  return cards;
}

let html = "";
let fetchError = null;
try {
  const response = await fetch(`${PRODUCTION_ORIGIN}/`, {
    headers: { "user-agent": "dtm-cms-readonly-audit" },
    redirect: "follow",
  });
  html = await response.text();
} catch (error) {
  fetchError = error instanceof Error ? error.message : String(error);
}

const rendered = html ? parseCards(html) : [];
const bySlug = new Map(rendered.map((card) => [card.slug, card.span]));

const rows = cmsRows.map((project) => {
  const renderedSpan = bySlug.get(project.slug) ?? null;
  let verdict = "UNOBSERVED";
  if (renderedSpan) {
    verdict = renderedSpan === project.cmsSpan ? "MATCH" : "MISMATCH";
  } else if (fetchError) {
    verdict = "FETCH_FAILED";
  } else if (html && rendered.length === 0) {
    verdict = "SSR_NO_DATA_SPAN";
  }
  return {
    ...project,
    renderedSpan,
    verdict,
  };
});

mkdirSync(OUT_DIR, { recursive: true });
const report = {
  origin: PRODUCTION_ORIGIN,
  generatedAt: new Date().toISOString(),
  fetchError,
  renderedCount: rendered.length,
  rows,
};

writeFileSync(
  path.join(OUT_DIR, "cms-production-audit.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("production read-only card-size audit");
console.log(
  rows
    .map(
      (row) =>
        `${row.verdict.padEnd(16)} ${row.slug} cms=${row.cmsSpan} rendered=${row.renderedSpan ?? "—"}`
    )
    .join("\n")
);

if (fetchError) {
  console.log(`fetch note: ${fetchError}`);
}

console.log(`wrote tmp/cms-production-audit.json (${rows.length} projects)`);
