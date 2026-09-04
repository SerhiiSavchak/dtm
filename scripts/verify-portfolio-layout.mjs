import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PORTFOLIO_CARD_SIZE_DEFAULT,
  PORTFOLIO_CARD_SIZE_TOKENS,
  portfolioCardLayout,
  portfolioCardSize,
} from "../lib/portfolio-layout.ts";
import { mapSanityProject, recordToProject } from "../lib/sanity/map-project.ts";
import { PORTFOLIO_PROJECTS_QUERY } from "../lib/sanity/queries.ts";
import { buildPortfolioSnapshot } from "../lib/sanity/snapshot-build.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPANS = ["large", "tall", "wide", "small"];

function sanityDoc(span, slug = `card-${span}`) {
  return {
    titleUa: `Проєкт ${span}`,
    slug,
    category: "house",
    coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
    span,
    gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
  };
}

assert.equal(PORTFOLIO_CARD_SIZE_DEFAULT, "small");

assert.equal(portfolioCardSize("large"), "large");
assert.equal(portfolioCardSize("small"), "small");
assert.notEqual(portfolioCardSize("large"), portfolioCardSize("small"));

const compositionA = portfolioCardLayout("wide");
const compositionB = portfolioCardLayout("tall");
assert.equal(compositionA.dataSpan, "wide");
assert.equal(compositionB.dataSpan, "tall");
assert.notEqual(compositionA.desktopFlexBasis, compositionB.desktopFlexBasis);

assert.equal(portfolioCardSize(null), "small");
assert.equal(portfolioCardSize(undefined), "small");
assert.equal(portfolioCardSize("huge"), "small");
assert.equal(portfolioCardLayout("nope").span, "small");

assert.match(PORTFOLIO_PROJECTS_QUERY, /^\s*span,$/m);

for (const span of SPANS) {
  const mapped = mapSanityProject(sanityDoc(span));
  assert.equal(mapped?.span, span, `map preserves ${span}`);
  const project = recordToProject(mapped, "uk");
  assert.equal(project.span, span);
  const layout = portfolioCardLayout(project.span);
  assert.equal(layout.dataSpan, span);
  assert.equal(layout.desktopFlexBasis, PORTFOLIO_CARD_SIZE_TOKENS[span].desktopFlexBasis);
}

const mappedLarge = mapSanityProject(sanityDoc("large", "same-project"));
const mappedSmall = mapSanityProject(sanityDoc("small", "same-project"));
assert.equal(portfolioCardLayout(mappedLarge?.span).dataSpan, "large");
assert.equal(portfolioCardLayout(mappedSmall?.span).dataSpan, "small");
assert.notEqual(
  portfolioCardLayout(mappedLarge?.span).desktopFlexBasis,
  portfolioCardLayout(mappedSmall?.span).desktopFlexBasis
);

const snapshot = buildPortfolioSnapshot(
  [sanityDoc("wide", "a"), sanityDoc("tall", "b")],
  { dataset: "development", generatedAt: "2026-09-04T00:00:00.000Z" }
);
assert.equal(snapshot.ok, true);
if (snapshot.ok) {
  assert.equal(snapshot.file.projects[0]?.span, "wide");
  assert.equal(snapshot.file.projects[1]?.span, "tall");
  assert.notEqual(
    portfolioCardLayout(snapshot.file.projects[0].span).desktopFlexBasis,
    portfolioCardLayout(snapshot.file.projects[1].span).desktopFlexBasis
  );
}

const lkg = JSON.parse(
  readFileSync(path.join(ROOT, "data", "generated", "portfolio.snapshot.json"), "utf8")
);
assert.ok(Array.isArray(lkg.projects) && lkg.projects.length > 0);
for (const project of lkg.projects) {
  assert.ok(SPANS.includes(project.span), `${project.slug} missing valid LKG span`);
}

const css = readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
assert.doesNotMatch(css, /\[data-span="(?:large|wide|tall|small)"\]:not\(\.is-lead\)/);
assert.doesNotMatch(
  css,
  /\.project-slide\.is-lead\s*\{[^}]*flex-basis/s
);
for (const span of SPANS) {
  const token = PORTFOLIO_CARD_SIZE_TOKENS[span];
  const block = new RegExp(
    `\\.project-slide\\[data-span="${span}"\\]\\s*\\{\\s*flex-basis:\\s*${token.desktopFlexBasis.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )};`
  );
  assert.match(css, block, `CSS token missing for ${span}`);
}

const ui = readFileSync(path.join(ROOT, "components", "projects.tsx"), "utf8");
assert.match(ui, /layoutSpan=\{portfolioCardSize\(project\.span\)\}/);
assert.doesNotMatch(ui, /editorialCardSpan\(/);

console.log("portfolio layout ok");
