import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_SITE_ORIGIN, siteUrl } from "../lib/site-url.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

assert.equal(CANONICAL_SITE_ORIGIN, "https://www.dtm.lviv.ua");
assert.equal(siteUrl(), CANONICAL_SITE_ORIGIN);

for (const rel of ["app/layout.tsx", "app/sitemap.ts", "app/robots.ts"]) {
  const src = read(rel);
  assert.match(src, /from "@\/lib\/site-url"/);
  assert.doesNotMatch(
    src,
    /dtm-chi\.vercel\.app/,
    `${rel} must not hardcode the staging host`
  );
}

const example = read(".env.example");
assert.match(example, /NEXT_PUBLIC_SITE_URL=/);
assert.match(example, /https:\/\/www\.dtm\.lviv\.ua/);

const admin = read("app/admin/[[...tool]]/page.tsx");
assert.match(admin, /robots:\s*\{\s*index:\s*false/);

console.log("site canonical checks passed");
