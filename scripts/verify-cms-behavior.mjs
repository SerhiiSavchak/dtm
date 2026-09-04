/**
 * Behavioral CMS contract: value A → observable output A (not schema presence).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CMS_FIELD_CONTRACT, CMS_SPAN_ENUM } from "../lib/cms/field-contract.ts";
import { dictionaries } from "../lib/i18n/dictionaries.ts";
import {
  formatInProgressArea,
  resolveInProgressTitle,
} from "../lib/in-progress-meta.ts";
import {
  PORTFOLIO_CARD_SIZE_TOKENS,
  portfolioCardLayout,
  portfolioCardSize,
} from "../lib/portfolio-layout.ts";
import {
  dossierFacts,
  portfolioCardLabels,
} from "../lib/portfolio/labels.ts";
import {
  compositionFromRecord,
  mapInProgressFrame,
} from "../lib/sanity/map-in-progress.ts";
import { mapSanityProject, recordToProject } from "../lib/sanity/map-project.ts";
import { PORTFOLIO_PROJECTS_QUERY } from "../lib/sanity/queries.ts";
import { buildPortfolioSnapshot } from "../lib/sanity/snapshot-build.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seen = new Set();
function cover(id) {
  seen.add(id);
}

function doc(overrides = {}) {
  return {
    titleUa: "Проєкт А",
    slug: "proj-a",
    objectType: "private_house",
    category: "house",
    coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
    gallery: [
      {
        src: "https://cdn.sanity.io/images/x/y/a.jpg",
        fit: "contain",
        objectPosition: "center center",
        thumbPosition: "center center",
      },
    ],
    ...overrides,
  };
}

const dictUk = dictionaries.uk.projects;

cover("order-independent-of-size");
const orderedSmallFirst = [
  mapSanityProject(doc({ slug: "first", span: "small", titleUa: "First" })),
  mapSanityProject(doc({ slug: "second", span: "large", titleUa: "Second" })),
];
assert.equal(orderedSmallFirst[0]?.slug, "first");
assert.equal(orderedSmallFirst[0]?.span, "small");
assert.equal(orderedSmallFirst[1]?.slug, "second");
assert.equal(orderedSmallFirst[1]?.span, "large");
const reversed = [
  mapSanityProject(doc({ slug: "second", span: "large", titleUa: "Second" })),
  mapSanityProject(doc({ slug: "first", span: "small", titleUa: "First" })),
];
assert.equal(reversed[0]?.slug, "second");
assert.equal(reversed[1]?.slug, "first");
assert.notEqual(portfolioCardLayout(reversed[0]?.span).desktopFlexBasis, portfolioCardLayout(reversed[1]?.span).desktopFlexBasis);

cover("titleUa-card-and-dossier");
const titled = mapSanityProject(doc({ titleUa: "вул. Затишна" }));
assert.equal(recordToProject(titled, "uk").title, "вул. Затишна");
assert.equal(portfolioCardLabels(titled, "uk", dictUk).title, "вул. Затишна");
assert.notEqual(portfolioCardLabels(titled, "uk", dictUk).title, "undefined");

cover("objectType-card-meta-dossier-fact");
for (const [objectType, ukLabel] of [
  ["new_build", dictUk.objectTypes.new_build],
  ["secondary", dictUk.objectTypes.secondary],
  ["private_house", dictUk.objectTypes.private_house],
  ["commercial", dictUk.objectTypes.commercial],
]) {
  const mapped = mapSanityProject(doc({ objectType, rooms: 2 }));
  const labels = portfolioCardLabels(mapped, "uk", dictUk);
  assert.ok(labels.meta?.includes(ukLabel), `objectType ${objectType} meta`);
  const facts = dossierFacts(recordToProject(mapped, "uk"), dictUk);
  assert.ok(facts.some((fact) => fact.value === ukLabel), `objectType ${objectType} fact`);
}
assert.equal(mapSanityProject(doc({ objectType: "castle", category: "castle" })), null);

cover("category-derived-hidden");
assert.equal(mapSanityProject(doc({ objectType: "new_build", category: "house" }))?.category, "apartment");

cover("locationUa-dossier-and-card-context");
const loc = mapSanityProject(
  doc({
    titleUa: "вул. Затишна",
    locationUa: "с. Сокільники, вул. Затишна",
  })
);
assert.equal(recordToProject(loc, "uk").location, "с. Сокільники, вул. Затишна");
assert.ok(portfolioCardLabels(loc, "uk", dictUk).meta?.includes("Сокільники"));
assert.ok(
  dossierFacts(recordToProject(loc, "uk"), dictUk).some((fact) =>
    fact.value.includes("Сокільники")
  )
);

cover("area-card-and-dossier");
const withArea = mapSanityProject(doc({ area: "265 м²" }));
assert.equal(portfolioCardLabels(withArea, "uk", dictUk).area, "265 м²");
assert.ok(
  dossierFacts(recordToProject(withArea, "uk"), dictUk).some((fact) => fact.value === "265 м²")
);
const noArea = mapSanityProject(doc({ area: "  " }));
assert.equal(portfolioCardLabels(noArea, "uk", dictUk).area, null);

cover("rooms-apartment-meta");
const apt = mapSanityProject(
  doc({ objectType: "new_build", rooms: 3, titleUa: "ЖК Тест" })
);
assert.equal(portfolioCardLabels(apt, "uk", dictUk).meta, `${dictUk.objectTypes.new_build} · 3 кімнати`);
assert.ok(
  dossierFacts(recordToProject(apt, "uk"), dictUk).some(
    (fact) => fact.label === dictUk.facts.rooms && fact.value === "3"
  )
);
const houseRooms = mapSanityProject(doc({ objectType: "private_house", rooms: 5 }));
assert.equal(
  dossierFacts(recordToProject(houseRooms, "uk"), dictUk).some((fact) => fact.label === dictUk.facts.rooms),
  false
);

cover("descriptionUa-optional-block");
const withCopy = mapSanityProject(doc({ descriptionUa: ["Перший абзац", "Другий"] }));
assert.deepEqual(recordToProject(withCopy, "uk").description, ["Перший абзац", "Другий"]);
const emptyCopy = mapSanityProject(doc({ descriptionUa: [] }));
assert.equal(recordToProject(emptyCopy, "uk").description, undefined);

cover("cover-src-on-card");
assert.equal(titled.cover, "https://cdn.sanity.io/images/x/y/c.jpg");
assert.equal(mapSanityProject(doc({ coverUrl: null })), null);

cover("gallery-order-and-count");
const gallery = mapSanityProject(
  doc({
    gallery: [
      { src: "https://cdn.sanity.io/images/x/y/1.jpg", fit: "contain" },
      { src: "https://cdn.sanity.io/images/x/y/2.jpg", fit: "cover" },
      { src: "https://cdn.sanity.io/images/x/y/3.jpg", fit: "contain" },
    ],
  })
);
assert.deepEqual(
  gallery.media.map((item) => item.src.slice(-5)),
  ["1.jpg", "2.jpg", "3.jpg"]
);
const twenty = Array.from({ length: 20 }, (_, i) => ({
  src: `https://cdn.sanity.io/images/x/y/${i}.jpg`,
  fit: "contain",
}));
assert.equal(mapSanityProject(doc({ gallery: twenty }))?.media.length, 20);
assert.equal(mapSanityProject(doc({ gallery: [] })), null);
assert.equal(mapSanityProject(doc({ gallery: [{ src: null }] })), null);

cover("workType-dossier-fact");
const work = mapSanityProject(doc({ workTypeUa: "Чорнові" }));
assert.ok(
  dossierFacts(recordToProject(work, "uk"), dictUk).some((fact) => fact.value === "Чорнові")
);

cover("duration-dossier-fact");
const dur = mapSanityProject(doc({ durationUa: "9 міс." }));
assert.ok(
  dossierFacts(recordToProject(dur, "uk"), dictUk).some((fact) => fact.value === "9 міс.")
);

cover("year-never-rendered");
const withYear = mapSanityProject(doc({ year: "2024" }));
assert.equal(withYear.year, null);
assert.equal(recordToProject(withYear, "uk").year, undefined);
assert.equal(
  dossierFacts(recordToProject(withYear, "uk"), dictUk).some((fact) =>
    /рік|year/i.test(fact.label)
  ),
  false
);

cover("titleEn-fallback-and-swap");
const bothTitles = mapSanityProject(doc({ titleUa: "Українська", titleEn: "English Title" }));
assert.equal(recordToProject(bothTitles, "uk").title, "Українська");
assert.equal(recordToProject(bothTitles, "en").title, "English Title");
assert.equal(recordToProject(bothTitles, "uk").title, "Українська");
const uaOnly = mapSanityProject(doc({ titleUa: "Лише UA", titleEn: null }));
assert.equal(recordToProject(uaOnly, "en").title, "Лише UA");
const longEn = mapSanityProject(
  doc({
    titleEn:
      "A very long English residential interior title that must remain visible and never leak placeholders",
  })
);
assert.ok(recordToProject(longEn, "en").title.includes("very long English"));
assert.doesNotMatch(recordToProject(longEn, "en").title, /\bundefined\b|\bnull\b/);

cover("locationEn-fallback");
const locBoth = mapSanityProject(
  doc({ locationUa: "с. Сокільники", locationEn: "Sokilnyky" })
);
assert.equal(recordToProject(locBoth, "uk").location, "с. Сокільники");
assert.equal(recordToProject(locBoth, "en").location, "Sokilnyky");
assert.equal(recordToProject(locBoth, "uk").location, "с. Сокільники");
const locUa = mapSanityProject(doc({ locationUa: "Львів", locationEn: "" }));
assert.equal(recordToProject(locUa, "en").location, "Львів");

cover("descriptionEn-fallback");
const desc = mapSanityProject(
  doc({ descriptionUa: ["UA copy"], descriptionEn: ["EN copy"] })
);
assert.deepEqual(recordToProject(desc, "en").description, ["EN copy"]);
assert.deepEqual(recordToProject(desc, "uk").description, ["UA copy"]);
const descUa = mapSanityProject(doc({ descriptionUa: ["UA only"], descriptionEn: [] }));
assert.deepEqual(recordToProject(descUa, "en").description, ["UA only"]);

cover("workTypeEn-fallback");
const wt = mapSanityProject(doc({ workTypeUa: "Чорнові", workTypeEn: "Shell" }));
assert.equal(recordToProject(wt, "en").workType, "Shell");
assert.equal(recordToProject(wt, "uk").workType, "Чорнові");
assert.equal(recordToProject(mapSanityProject(doc({ workTypeUa: "Чорнові" })), "en").workType, "Чорнові");

cover("durationEn-fallback");
const dn = mapSanityProject(doc({ durationUa: "9 міс.", durationEn: "9 mo." }));
assert.equal(recordToProject(dn, "en").duration, "9 mo.");
assert.equal(recordToProject(dn, "uk").duration, "9 міс.");

cover("locationKey-legacy-fallback-only");
const freeLoc = mapSanityProject(
  doc({ locationUa: "с. Сокільники", locationKey: "lviv" })
);
assert.equal(recordToProject(freeLoc, "uk").locationKey, undefined);
const legacyLoc = mapSanityProject(doc({ locationUa: null, locationKey: "lviv" }));
assert.equal(recordToProject(legacyLoc, "uk").locationKey, "lviv");

cover("slug-identity");
assert.equal(mapSanityProject(doc({ slug: "my-slug" }))?.slug, "my-slug");
assert.equal(mapSanityProject(doc({ slug: "  " })), null);

cover("span-card-size-geometry");
assert.match(PORTFOLIO_PROJECTS_QUERY, /^\s*span,$/m);
for (const span of CMS_SPAN_ENUM) {
  const mapped = mapSanityProject(doc({ span, slug: `card-${span}` }));
  assert.equal(mapped?.span, span);
  const layout = portfolioCardLayout(mapped.span);
  assert.equal(layout.dataSpan, span);
  assert.equal(layout.desktopFlexBasis, PORTFOLIO_CARD_SIZE_TOKENS[span].desktopFlexBasis);
}
assert.notEqual(portfolioCardSize("large"), portfolioCardSize("small"));
assert.notEqual(
  portfolioCardLayout("large").desktopFlexBasis,
  portfolioCardLayout("small").desktopFlexBasis
);
assert.equal(portfolioCardSize(null), "small");
assert.equal(portfolioCardSize("huge"), "small");
const aThenB = portfolioCardLayout("wide");
const bThenA = portfolioCardLayout("tall");
assert.equal(portfolioCardLayout("wide").dataSpan, aThenB.dataSpan);
assert.equal(portfolioCardLayout("tall").dataSpan, bThenA.dataSpan);
const rapid = ["large", "small", "wide"].map((span) => portfolioCardSize(span));
assert.deepEqual(rapid, ["large", "small", "wide"]);
assert.equal(portfolioCardSize("large"), "large");

const snapshot = buildPortfolioSnapshot(
  [doc({ slug: "a", span: "wide" }), doc({ slug: "b", span: "tall" })],
  { dataset: "development", generatedAt: "2026-09-04T00:00:00.000Z" }
);
assert.equal(snapshot.ok, true);
if (snapshot.ok) {
  assert.equal(snapshot.file.projects[0].span, "wide");
  assert.equal(snapshot.file.projects[1].span, "tall");
}

const css = readFileSync(path.join(ROOT, "app", "globals.css"), "utf8");
const ui = readFileSync(path.join(ROOT, "components", "projects.tsx"), "utf8");
assert.match(ui, /layoutSpan=\{portfolioCardSize\(project\.span\)\}/);
assert.doesNotMatch(ui, /editorialCardSpan\(/);
assert.doesNotMatch(css, /\[data-span="(?:large|wide|tall|small)"\]:not\(\.is-lead\)/);
assert.doesNotMatch(css, /\.project-slide\.is-lead\s*\{[^}]*flex-basis/s);
for (const span of CMS_SPAN_ENUM) {
  assert.match(
    css,
    new RegExp(
      `\\.project-slide\\[data-span="${span}"\\]\\s*\\{\\s*flex-basis:\\s*${PORTFOLIO_CARD_SIZE_TOKENS[span].desktopFlexBasis.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )};`
    )
  );
}

cover("coverPosition-computed-style");
const posA = mapSanityProject(doc({ coverPosition: "center 20%" }));
const posB = mapSanityProject(doc({ coverPosition: "left top" }));
assert.equal(recordToProject(posA, "uk").coverPosition, "center 20%");
assert.equal(recordToProject(posB, "uk").coverPosition, "left top");
assert.notEqual(posA.coverPosition, posB.coverPosition);
assert.equal(mapSanityProject(doc({ coverPosition: null }))?.coverPosition, "center center");

cover("hotspot-superseded-by-coverPosition");
assert.doesNotMatch(PORTFOLIO_PROJECTS_QUERY, /cover\.hotspot/);

cover("gallery-image-src");
assert.equal(gallery.media[0].src.endsWith("1.jpg"), true);

cover("gallery-video-optional-real-portfolio-zero");
const withVideo = mapSanityProject(
  doc({
    gallery: [
      {
        src: "https://cdn.sanity.io/images/x/y/a.jpg",
        video: "https://cdn.sanity.io/files/x/y/v.mp4",
        fit: "contain",
      },
    ],
  })
);
assert.equal(withVideo.media[0].video?.endsWith("v.mp4"), true);
const lkg = JSON.parse(
  readFileSync(path.join(ROOT, "data", "generated", "portfolio.snapshot.json"), "utf8")
);
assert.equal(
  lkg.projects.every((project) => !project.media?.some((item) => item.video)),
  true
);

cover("gallery-fit-object-fit");
const fitA = mapSanityProject(
  doc({ gallery: [{ src: "https://cdn.sanity.io/images/x/y/a.jpg", fit: "contain" }] })
);
const fitB = mapSanityProject(
  doc({ gallery: [{ src: "https://cdn.sanity.io/images/x/y/a.jpg", fit: "cover" }] })
);
assert.equal(fitA.media[0].fit, "contain");
assert.equal(fitB.media[0].fit, "cover");
assert.notEqual(fitA.media[0].fit, fitB.media[0].fit);
assert.equal(
  mapSanityProject(
    doc({ gallery: [{ src: "https://cdn.sanity.io/images/x/y/a.jpg", fit: "stretch" }] })
  ).media[0].fit,
  "contain"
);
assert.match(css, /data-fit="contain"[\s\S]*object-fit:\s*contain/);
assert.match(css, /data-fit="cover"[\s\S]*object-fit:\s*cover/);

cover("gallery-objectPosition");
const objA = mapSanityProject(
  doc({
    gallery: [
      {
        src: "https://cdn.sanity.io/images/x/y/a.jpg",
        objectPosition: "20% 80%",
      },
    ],
  })
);
const objB = mapSanityProject(
  doc({
    gallery: [
      {
        src: "https://cdn.sanity.io/images/x/y/a.jpg",
        objectPosition: "left top",
      },
    ],
  })
);
assert.equal(objA.media[0].objectPosition, "20% 80%");
assert.equal(objB.media[0].objectPosition, "left top");
assert.notEqual(objA.media[0].objectPosition, objB.media[0].objectPosition);

cover("gallery-thumbPosition");
const thumb = mapSanityProject(
  doc({
    gallery: [
      {
        src: "https://cdn.sanity.io/images/x/y/a.jpg",
        objectPosition: "center center",
        thumbPosition: "center 10%",
      },
    ],
  })
);
assert.equal(thumb.media[0].thumbPosition, "center 10%");
assert.notEqual(thumb.media[0].thumbPosition, thumb.media[0].objectPosition);
const dossierUi = readFileSync(
  path.join(ROOT, "components", "project-dossier.tsx"),
  "utf8"
);
assert.match(dossierUi, /thumbPosition \?\? item\.objectPosition/);

cover("hotspot-superseded-by-objectPosition");
assert.doesNotMatch(PORTFOLIO_PROJECTS_QUERY, /image\.hotspot/);

cover("in-progress-viewer-order");
const frames = ["z", "a", "m"].map((id, index) =>
  mapInProgressFrame({
    frameId: id,
    mediaType: "photo",
    src: `https://cdn.sanity.io/images/x/y/${index}.jpg`,
    titleUa: id,
  })
);
assert.deepEqual(frames.map((item) => item.id), ["z", "a", "m"]);

cover("in-progress-titleUa");
const frameTitle = mapInProgressFrame({
  frameId: "t",
  mediaType: "video",
  video: "https://cdn.sanity.io/files/x/y/full.mp4",
  titleUa: "ЖК Perfect Life",
  titleEn: "Perfect Life",
});
assert.equal(resolveInProgressTitle(frameTitle, "uk"), "ЖК Perfect Life");

cover("in-progress-titleEn-fallback");
assert.equal(resolveInProgressTitle(frameTitle, "en"), "Perfect Life");
assert.equal(
  resolveInProgressTitle({ titleUa: "ЖК MS", titleEn: "" }, "en"),
  "ЖК MS"
);
assert.equal(resolveInProgressTitle({ titleUa: "ЖК MS" }, "uk"), "ЖК MS");
assert.equal(resolveInProgressTitle({ titleUa: "ЖК MS" }, "en"), "ЖК MS");

cover("in-progress-area");
assert.equal(formatInProgressArea(60, "uk"), "60\u00A0м²");
assert.equal(formatInProgressArea(90, "en"), "90\u00A0m²");
assert.equal(formatInProgressArea(null, "uk"), null);

cover("in-progress-label-not-public");
const framesQuery = readFileSync(path.join(ROOT, "lib", "sanity", "queries.ts"), "utf8");
assert.doesNotMatch(framesQuery, /IN_PROGRESS_FRAMES_QUERY[\s\S]*\n\s*label,/);
assert.equal(
  mapInProgressFrame({
    frameId: "lab",
    mediaType: "video",
    video: "https://cdn.sanity.io/files/x/y/full.mp4",
    label: "SECRET ADMIN",
  })?.titleUa,
  undefined
);
assert.equal(JSON.stringify(frameTitle).includes("SECRET"), false);

cover("in-progress-mediaType");
assert.equal(
  mapInProgressFrame({
    frameId: "photo",
    mediaType: "photo",
    src: "https://cdn.sanity.io/images/x/y/a.jpg",
  })?.panel,
  "portrait"
);
assert.equal(
  mapInProgressFrame({
    frameId: "vid",
    mediaType: "video",
    video: "https://cdn.sanity.io/files/x/y/full.mp4",
  })?.panel,
  "video"
);
assert.equal(
  mapInProgressFrame({
    frameId: "bad",
    mediaType: "audio",
  }),
  null
);
assert.equal(
  mapInProgressFrame({
    frameId: "legacy-audio",
    mediaType: "audio",
    src: "https://cdn.sanity.io/images/x/y/a.jpg",
  })?.panel,
  "portrait"
);

cover("in-progress-still");
assert.ok(
  mapInProgressFrame({
    frameId: "still",
    mediaType: "photo",
    src: "https://cdn.sanity.io/images/x/y/still.jpg",
  })?.src.endsWith("still.jpg")
);

cover("in-progress-full-video-in-viewer");
const preview = "https://cdn.sanity.io/files/x/y/preview.mp4";
const full = "https://cdn.sanity.io/files/x/y/full.mp4";
const both = mapInProgressFrame({
  frameId: "both",
  mediaType: "video",
  video: full,
  previewVideo: preview,
  src: "https://cdn.sanity.io/images/x/y/p.jpg",
});
assert.equal(both.video, full);
assert.equal(both.previewVideo, preview);
assert.notEqual(both.video, both.previewVideo);
const viewer = readFileSync(
  path.join(ROOT, "components", "sections", "in-progress-viewer.tsx"),
  "utf8"
);
assert.match(viewer, /mp4=\{item\.video\}/);
assert.doesNotMatch(viewer, /previewVideo/);

cover("preview-vs-full-distinct");
const panel = readFileSync(
  path.join(ROOT, "components", "sections", "in-progress.tsx"),
  "utf8"
);
assert.match(panel, /item\.previewVideo \?\? item\.video/);
assert.equal(both.previewVideo ?? both.video, preview);

cover("in-progress-poster");
assert.ok(
  mapInProgressFrame({
    frameId: "poster",
    mediaType: "video",
    video: full,
    src: "https://cdn.sanity.io/images/x/y/poster.jpg",
  })?.src.endsWith("poster.jpg")
);

cover("in-progress-objectPosition");
const ipPosA = mapInProgressFrame({
  frameId: "opa",
  mediaType: "photo",
  src: "https://cdn.sanity.io/images/x/y/a.jpg",
  objectPosition: "20% 30%",
});
const ipPosB = mapInProgressFrame({
  frameId: "opb",
  mediaType: "photo",
  src: "https://cdn.sanity.io/images/x/y/a.jpg",
  objectPosition: "left top",
});
assert.equal(ipPosA.objectPosition, "20% 30%");
assert.equal(ipPosB.objectPosition, "left top");
assert.match(viewer, /objectPosition: item\.objectPosition/);
assert.match(panel, /objectPosition=\{item\.objectPosition\}/);

cover("frameId-identity");
assert.equal(
  mapInProgressFrame({
    frameId: "perfect-life-60",
    mediaType: "video",
    video: full,
  })?.id,
  "perfect-life-60"
);

cover("board-order-left-to-right");
const board = compositionFromRecord({
  frames: [
    { id: "a", objectPosition: "center", panel: "video", titleUa: "A" },
    { id: "b", objectPosition: "center", panel: "video", titleUa: "B" },
    { id: "c", objectPosition: "center", panel: "video", titleUa: "C" },
    { id: "d", objectPosition: "center", panel: "video", titleUa: "D" },
  ],
  boardIds: ["d", "b", "a", "c"],
});
assert.deepEqual(
  board.map((item) => item.id),
  ["d", "b", "a", "c"]
);
const boardReverse = compositionFromRecord({
  frames: board,
  boardIds: ["a", "c", "b", "d"],
});
assert.deepEqual(
  boardReverse.map((item) => item.id),
  ["a", "c", "b", "d"]
);

const nullish = mapSanityProject(
  doc({
    titleEn: null,
    locationEn: null,
    descriptionEn: null,
    rooms: null,
    workTypeEn: undefined,
  })
);
const asText = JSON.stringify(recordToProject(nullish, "en"));
assert.doesNotMatch(asText, /"undefined"|:"null"/);
assert.doesNotMatch(recordToProject(nullish, "en").title, /undefined|null/);

assert.ok(CMS_FIELD_CONTRACT.length > 0, "registry loaded");

const missing = CMS_FIELD_CONTRACT.map((row) => row.behavioralTest).filter(
  (id) => !seen.has(id)
);
assert.deepEqual(missing, [], `uncovered behavioral ids: ${missing.join(", ")}`);

console.log(`cms behavior ok (${seen.size} contracts)`);
