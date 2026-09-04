/**
 * CI gate: every schema field is classified; intended frontend fields have
 * GROQ + consumer + behavioral test. Unclassified / unconsumed = FAIL.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CMS_FIELD_CONTRACT,
  CMS_FIT_ENUM,
  CMS_MEDIA_TYPE_ENUM,
  CMS_OBJECT_TYPE_ENUM,
  CMS_SPAN_ENUM,
} from "../lib/cms/field-contract.ts";
import { PORTFOLIO_CARD_SIZE_TOKENS } from "../lib/portfolio-layout.ts";
import {
  IN_PROGRESS_BOARD_QUERY,
  IN_PROGRESS_FRAMES_QUERY,
  PORTFOLIO_PROJECTS_QUERY,
} from "../lib/sanity/queries.ts";
import { inProgressBoard } from "../sanity/schemaTypes/inProgressBoard.ts";
import { inProgressFrame } from "../sanity/schemaTypes/inProgressFrame.ts";
import { project } from "../sanity/schemaTypes/project.ts";
import { projectMedia } from "../sanity/schemaTypes/projectMedia.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function fail(label) {
  failures.push(label);
}

function fieldNames(type) {
  return type.fields.map((item) => item.name);
}

function enumValues(type, name) {
  const field = type.fields.find((item) => item.name === name);
  const list = field?.options?.list;
  if (!Array.isArray(list)) return [];
  return list.map((item) => (typeof item === "string" ? item : item.value));
}

function readRel(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const SCHEMA = {
  project,
  projectMedia,
  inProgressFrame,
  inProgressBoard,
};

const ids = new Set();
for (const row of CMS_FIELD_CONTRACT) {
  if (ids.has(row.id)) fail(`duplicate contract id ${row.id}`);
  ids.add(row.id);
  if (!["A", "B", "C", "D", "E", "F", "G"].includes(row.class)) {
    fail(`${row.id} invalid class ${row.class}`);
  }
  if (row.status !== "PASS" && row.status !== "INTENTIONALLY INTERNAL") {
    fail(`${row.id} invalid status ${row.status}`);
  }
  if (row.status === "PASS" && !row.intendedFrontend && row.class !== "F") {
    // F fields may be PASS-covered internally; status INTENTIONALLY INTERNAL is required for F/G public matrix
  }
  if ((row.class === "A" || row.class === "B" || row.class === "C" || row.class === "D" || row.class === "E") &&
      row.status !== "PASS") {
    fail(`${row.id} client-facing class ${row.class} must be PASS`);
  }
  if ((row.class === "F" || row.class === "G") && row.status !== "INTENTIONALLY INTERNAL") {
    fail(`${row.id} class ${row.class} must be INTENTIONALLY INTERNAL`);
  }
  if (!row.behavioralTest) fail(`${row.id} missing behavioralTest id`);
  if (row.intendedFrontend && row.consumerFiles.length === 0) {
    fail(`${row.id} intended frontend field has no consumer`);
  }
}

for (const [docType, schema] of Object.entries(SCHEMA)) {
  const schemaNames = new Set(fieldNames(schema));
  const registered = CMS_FIELD_CONTRACT.filter(
    (row) => row.documentType === docType && row.schemaKind !== "image-hotspot"
  );
  const registeredNames = new Set(registered.map((row) => row.field));

  for (const name of schemaNames) {
    if (!registeredNames.has(name)) {
      fail(`UNCLASSIFIED schema field ${docType}.${name}`);
    }
  }
  for (const row of registered) {
    if (!schemaNames.has(row.field)) {
      fail(`contract field missing from schema ${row.id}`);
    }
    if (row.studioTitle) {
      const field = schema.fields.find((item) => item.name === row.field);
      if (field?.title !== row.studioTitle) {
        fail(
          `${row.id} studio title drift: schema=${JSON.stringify(field?.title)} contract=${JSON.stringify(row.studioTitle)}`
        );
      }
    }
  }
}

assert.equal(fieldNames(project).includes("span"), true);
assert.equal(
  project.fields.find((item) => item.name === "span")?.title,
  "Розмір картки"
);

const groqBundle = {
  project: PORTFOLIO_PROJECTS_QUERY,
  projectMedia: PORTFOLIO_PROJECTS_QUERY,
  inProgressFrame: IN_PROGRESS_FRAMES_QUERY,
  inProgressBoard: IN_PROGRESS_BOARD_QUERY,
};

for (const row of CMS_FIELD_CONTRACT) {
  if (row.schemaKind === "image-hotspot") continue;
  const groq = groqBundle[row.documentType];
  if (row.groq === "omitted-intentional") {
    if (row.field === "label" && /label/.test(IN_PROGRESS_FRAMES_QUERY)) {
      fail("inProgressFrame.label leaked into GROQ");
    }
    continue;
  }
  if (row.groqNeedle && !groq.includes(row.groqNeedle)) {
    fail(`${row.id} GROQ missing needle ${JSON.stringify(row.groqNeedle)}`);
  }
}

for (const row of CMS_FIELD_CONTRACT) {
  if (!row.intendedFrontend) continue;
  const blob = row.consumerFiles.map((file) => readRel(file)).join("\n");
  for (const needle of row.consumerNeedles) {
    if (!blob.includes(needle)) {
      fail(`${row.id} consumers missing ${JSON.stringify(needle)}`);
    }
  }
}

const layout = readRel("lib/portfolio-layout.ts");
if (layout.includes("editorialCardSpan") || layout.includes("AFTER_LEAD")) {
  fail("index-based editorialCardSpan still present — CMS span would be dead");
}
const ui = readRel("components/projects.tsx");
if (ui.includes("editorialCardSpan(")) {
  fail("projects.tsx still calls editorialCardSpan");
}
if (!ui.includes("portfolioCardSize(project.span)")) {
  fail("projects.tsx does not bind CMS span");
}
const css = readRel("app/globals.css");
if (/\[data-span="(?:large|wide|tall|small)"\]:not\(\.is-lead\)/.test(css)) {
  fail("CSS still ignores CMS span for non-lead cards");
}
if (/\.project-slide\.is-lead\s*\{[^}]*flex-basis/s.test(css)) {
  fail("CSS is-lead flex-basis override still wins over CMS span");
}

const schemaSpan = enumValues(project, "span");
assert.deepEqual(schemaSpan, [...CMS_SPAN_ENUM]);
assert.deepEqual(Object.keys(PORTFOLIO_CARD_SIZE_TOKENS).sort(), [...CMS_SPAN_ENUM].sort());
for (const span of CMS_SPAN_ENUM) {
  if (!css.includes(`.project-slide[data-span="${span}"]`)) {
    fail(`CSS missing data-span=${span}`);
  }
}

assert.deepEqual(enumValues(project, "objectType"), [...CMS_OBJECT_TYPE_ENUM]);
assert.deepEqual(enumValues(projectMedia, "fit"), [...CMS_FIT_ENUM]);
assert.deepEqual(enumValues(inProgressFrame, "mediaType"), [...CMS_MEDIA_TYPE_ENUM]);

const mapProject = readRel("lib/sanity/map-project.ts");
for (const span of CMS_SPAN_ENUM) {
  if (!mapProject.includes(`"${span}"`) && !mapProject.includes(`'${span}'`)) {
    // parseSpan uses SPANS array from Project["span"] — check SPANS const
  }
}
if (!mapProject.includes('["large", "tall", "wide", "small"]')) {
  fail("map-project parseSpan enum drifted from schema span");
}

const types = readRel("data/projects.ts");
if (!types.includes('"large" | "tall" | "wide" | "small"')) {
  fail("Project.span TS union drifted from schema");
}

const labelQuery = IN_PROGRESS_FRAMES_QUERY;
if (/\blabel\b/.test(labelQuery) && !labelQuery.includes("titleUa")) {
  fail("unexpected label in frames query");
}
if (IN_PROGRESS_FRAMES_QUERY.includes("\n  label,") || IN_PROGRESS_FRAMES_QUERY.includes("\n  label\n")) {
  fail("admin label projected to frontend");
}

if (ui.includes("nth-child") && /project-slide/.test(ui)) {
  fail("projects.tsx uses nth-child for slides");
}

const behavior = readRel("scripts/verify-cms-behavior.mjs");
for (const row of CMS_FIELD_CONTRACT) {
  if (!behavior.includes(row.behavioralTest)) {
    fail(`${row.id} behavioral test id ${row.behavioralTest} not referenced in verify-cms-behavior.mjs`);
  }
}

const intended = CMS_FIELD_CONTRACT.filter((row) => row.intendedFrontend);
const internal = CMS_FIELD_CONTRACT.filter((row) => !row.intendedFrontend);

console.log(
  `cms field contract: ${CMS_FIELD_CONTRACT.length} rows, ${intended.length} client-facing, ${internal.length} internal/legacy`
);

if (failures.length) {
  console.error("cms field contract FAILED:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("cms field contract ok");
