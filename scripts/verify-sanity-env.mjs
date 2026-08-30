import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

const envTs = read("sanity/env.ts");
assert.match(envTs, /NEXT_PUBLIC_SANITY_PROJECT_ID/);
assert.match(envTs, /NEXT_PUBLIC_SANITY_DATASET/);
assert.equal(
  (envTs.match(/NEXT_PUBLIC_SANITY_PROJECT_ID/g) ?? []).length,
  1,
  "project id must be read in one canonical place"
);

const adminPage = read("app/admin/[[...tool]]/page.tsx");
assert.match(adminPage, /from "@\/sanity\/env"/);
assert.match(adminPage, /sanityProjectId/);
assert.match(adminPage, /Адмінка ще не підключена/);
assert.match(adminPage, /Vercel/);

const clientTs = read("lib/sanity/client.ts");
assert.match(clientTs, /from "@\/sanity\/env"/);
assert.match(clientTs, /sanityProjectId/);

const studioConfig = read("sanity.config.ts");
assert.match(studioConfig, /from "\.\/sanity\/env"/);

const example = read(".env.example");
assert.match(example, /NEXT_PUBLIC_SANITY_PROJECT_ID/);
assert.match(example, /NEXT_PUBLIC_SANITY_DATASET/);

console.log("sanity env wiring ok");
