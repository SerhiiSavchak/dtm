import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_SITE_ORIGIN, siteUrl } from "../lib/site-url.ts";
import robots from "../app/robots.ts";
import sitemap from "../app/sitemap.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WWW = "https://www.dtm.lviv.ua";
const STAGING_MARKERS = [
  "dtm-chi.vercel.app",
  "localhost",
  "127.0.0.1",
  "vercel.app",
];

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

assert.equal(CANONICAL_SITE_ORIGIN, WWW);
assert.equal(siteUrl(), WWW);

const layout = read("app/layout.tsx");
const robotsSrc = read("app/robots.ts");
const sitemapSrc = read("app/sitemap.ts");
const admin = read("app/admin/[[...tool]]/page.tsx");
const example = read(".env.example");

assert.match(layout, /from "@\/lib\/site-url"/);
assert.match(robotsSrc, /from "@\/lib\/site-url"/);
assert.match(sitemapSrc, /from "@\/lib\/site-url"/);

assert.match(layout, /metadataBase:\s*new URL\(SITE_URL\)/);
assert.match(layout, /alternates:\s*\{\s*canonical:\s*"\/"/);
assert.match(layout, /robots:\s*\{\s*index:\s*true,\s*follow:\s*true\s*\}/);
assert.doesNotMatch(
  layout,
  /robots:\s*\{\s*index:\s*false/,
  "homepage root layout must not set global noindex"
);

assert.match(admin, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);

const robotsConfig = robots();
assert.equal(robotsConfig.sitemap, `${WWW}/sitemap.xml`);
assert.equal(robotsConfig.rules.allow, "/");
assert.deepEqual(robotsConfig.rules.disallow, ["/admin"]);
assert.equal(robotsConfig.rules.userAgent, "*");
assert.equal(
  JSON.stringify(robotsConfig.rules.disallow).includes("/_next"),
  false
);
assert.equal(JSON.stringify(robotsConfig).includes("/images"), false);

const entries = sitemap();
assert.equal(entries.length, 1);
assert.equal(entries[0].url, WWW);
for (const entry of entries) {
  assert.match(entry.url, /^https:\/\/www\.dtm\.lviv\.ua\/?$/);
  for (const marker of STAGING_MARKERS) {
    assert.equal(
      entry.url.includes(marker),
      false,
      `sitemap URL must not contain ${marker}`
    );
  }
}

for (const rel of ["app/layout.tsx", "app/sitemap.ts", "app/robots.ts", "lib/site-url.ts"]) {
  const src = read(rel);
  assert.doesNotMatch(src, /dtm-chi\.vercel\.app/, `${rel} staging host`);
  assert.doesNotMatch(src, /localhost/, `${rel} localhost`);
}

assert.match(example, /NEXT_PUBLIC_SITE_URL=/);
assert.match(example, /https:\/\/www\.dtm\.lviv\.ua/);
assert.match(example, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=/);
assert.match(layout, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION/);
assert.doesNotMatch(
  layout,
  /google-site-verification["']\s*,\s*["'][A-Za-z0-9_-]{8,}/,
  "must not hardcode a Search Console token"
);

console.log("site canonical / indexability checks passed");
