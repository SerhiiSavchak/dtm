import { recordToProject, mapSanityProject } from "../lib/sanity/map-project.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

const mapped = mapSanityProject({
  titleUa: "Тест 01",
  titleEn: "Test 01",
  slug: "test-01",
  category: "apartment",
  locationKey: "lviv",
  descriptionUa: ["Абзац UA"],
  descriptionEn: ["Paragraph EN"],
  area: "72 м²",
  workTypeUa: "Чорнові",
  workTypeEn: "Shell",
  durationUa: "2 місяці",
  durationEn: "2 months",
  year: "2026",
  coverUrl: "https://cdn.sanity.io/images/x/y/cover.jpg",
  coverLqip: "data:image/jpeg;base64,aaa",
  coverPosition: "center 40%",
  span: "tall",
  gallery: [
    {
      src: "https://cdn.sanity.io/images/x/y/a.jpg",
      fit: "contain",
      objectPosition: "center center",
      thumbPosition: "center 20%",
    },
    {
      src: "https://cdn.sanity.io/images/x/y/b.jpg",
      video: "https://cdn.sanity.io/files/x/y/v.mp4",
      fit: "cover",
    },
  ],
});

assert("maps published project", Boolean(mapped));
assert("keeps slug", mapped?.slug === "test-01");
assert("keeps span", mapped?.span === "tall");
assert("gallery order", mapped?.media[1]?.video?.endsWith("v.mp4") === true);
assert("drops empty gallery src", mapSanityProject({
  titleUa: "X",
  slug: "x",
  category: "house",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: null }],
}) === null);

assert("rejects unknown category", mapSanityProject({
  titleUa: "X",
  slug: "x",
  category: "castle",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
}) === null);

assert("malformed span falls back to small", mapSanityProject({
  titleUa: "X",
  slug: "x",
  category: "commercial",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  span: "huge",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
})?.span === "small");

const en = recordToProject(mapped, "en");
assert("EN title", en.title === "Test 01");
assert("EN workType", en.workType === "Shell");
assert("EN description", Array.isArray(en.description) && en.description[0] === "Paragraph EN");

const uk = recordToProject(mapped, "uk");
assert("UA title", uk.title === "Тест 01");

const missingEn = mapSanityProject({
  titleUa: "Лише українською",
  slug: "ua-only",
  category: "apartment",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
});
assert(
  "EN falls back to UA",
  recordToProject(missingEn, "en").title === "Лише українською"
);

if (failures.length) {
  console.error("portfolio map failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("portfolio map checks passed");
