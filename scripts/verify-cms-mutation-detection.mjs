/**
 * Mutation testing: inject wiring defects, prove the CMS behavioral suite
 * fails, then restore sources. Detection must be 100%.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE = process.execPath;
const IMPORT = ["--import", "./scripts/register-ts-ext.mjs", "--experimental-strip-types", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON"];

function run(script) {
  return spawnSync(NODE, [...IMPORT, script], {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
  });
}

const originals = new Map();

function readRel(rel) {
  const abs = path.join(ROOT, rel);
  if (!originals.has(rel)) originals.set(rel, readFileSync(abs, "utf8"));
  return originals.get(rel);
}

function writeRel(rel, contents) {
  writeFileSync(path.join(ROOT, rel), contents, "utf8");
}

function restoreAll() {
  for (const [rel, contents] of originals) {
    writeFileSync(path.join(ROOT, rel), contents, "utf8");
  }
}

process.on("exit", restoreAll);
process.on("SIGINT", () => {
  restoreAll();
  process.exit(1);
});
process.on("uncaughtException", (error) => {
  restoreAll();
  console.error(error);
  process.exit(1);
});

const mutants = [
  {
    id: "card-size-ignore-cms",
    file: "lib/portfolio-layout.ts",
    apply: (src) =>
      src.replace(
        "return parseSpan(storedSpan) ?? PORTFOLIO_CARD_SIZE_DEFAULT;",
        "return PORTFOLIO_CARD_SIZE_DEFAULT;"
      ),
    tests: ["scripts/verify-cms-behavior.mjs", "scripts/verify-portfolio-layout.mjs"],
  },
  {
    id: "card-size-css-lead-override",
    file: "app/globals.css",
    apply: (src) =>
      src.replace(
        '.project-slide[data-span="large"]',
        '.project-slide.is-lead { flex-basis: min(42vw, 36rem); }\n  .project-slide[data-span="large"]:not(.is-lead)'
      ),
    tests: ["scripts/verify-portfolio-layout.mjs", "scripts/verify-cms-field-contract.mjs"],
  },
  {
    id: "groq-drop-span",
    file: "lib/sanity/queries.ts",
    apply: (src) => src.replace(/^\s*span,\s*$/m, ""),
    tests: ["scripts/verify-cms-field-contract.mjs", "scripts/verify-portfolio-layout.mjs"],
  },
  {
    id: "objectPosition-hardcoded",
    file: "lib/sanity/map-project.ts",
    apply: (src) =>
      src.replace(
        "objectPosition: item.objectPosition?.trim() || \"center center\",",
        "objectPosition: \"center center\","
      ),
    tests: ["scripts/verify-cms-behavior.mjs"],
  },
  {
    id: "titleEn-ignored",
    file: "lib/sanity/map-project.ts",
    apply: (src) =>
      src.replace(
        "if (locale === \"en\") return english ?? uk;",
        "if (locale === \"en\") return uk;"
      ),
    tests: ["scripts/verify-cms-behavior.mjs"],
  },
  {
    id: "viewer-uses-preview",
    file: "components/sections/in-progress-viewer.tsx",
    apply: (src) => src.replace("mp4={item.video}", "mp4={item.previewVideo ?? item.video}"),
    tests: ["scripts/verify-preview-video-sources.mjs", "scripts/verify-cms-behavior.mjs"],
  },
  {
    id: "board-order-ignored",
    file: "lib/sanity/map-in-progress.ts",
    apply: (src) => src.replace("return record.boardIds", "return record.frames.slice(0, 4); return record.boardIds"),
    tests: ["scripts/verify-cms-behavior.mjs", "scripts/verify-in-progress-map.mjs"],
  },
];

const results = [];

for (const mutant of mutants) {
  restoreAll();
  const before = readRel(mutant.file);
  const after = mutant.apply(before);
  if (after === before) {
    results.push({ id: mutant.id, detected: false, reason: "mutant did not change source" });
    continue;
  }
  writeRel(mutant.file, after);
  let detected = false;
  let detail = "";
  for (const script of mutant.tests) {
    const ran = run(script);
    if (ran.status !== 0) {
      detected = true;
      detail = `${script} exit ${ran.status}`;
      break;
    }
    detail = `${script} unexpectedly passed`;
  }
  results.push({ id: mutant.id, detected, reason: detail });
}

restoreAll();

const missed = results.filter((item) => !item.detected);
console.log(
  "cms mutation detection:\n" +
    results.map((item) => `  ${item.detected ? "DETECTED" : "MISSED "} ${item.id} (${item.reason})`).join("\n")
);

if (missed.length) {
  console.error(`FAIL: ${missed.length}/${results.length} mutants were not detected`);
  process.exit(1);
}

console.log(`cms mutation detection ok (${results.length}/${results.length})`);
