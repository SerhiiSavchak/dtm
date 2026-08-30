/**
 * Normalize Portfolio IA for seven real development projects.
 * Patches title/objectType/location/category in place. Preserves ids, slugs, media, orderRank.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PATCHES = [
  {
    id: "dtm-real-project-sokilnyky",
    titleUa: "вул. Затишна",
    titleEn: "Zatyshna St.",
    objectType: "private_house",
    category: "house",
    locationUa: "с. Сокільники, вул. Затишна",
    locationEn: "Sokilnyky, Zatyshna St.",
    rooms: null,
    area: "265 м²",
    workTypeUa: "Реалізація за готовим дизайн-проєктом клієнта",
    workTypeEn: "Build-out from the client's design project",
    durationUa: "9 міс.",
    durationEn: "9 mo.",
  },
  {
    id: "dtm-real-project-novoznesenska",
    titleUa: "вул. Новознесенська",
    titleEn: "Novoznesenska St.",
    objectType: "private_house",
    category: "house",
    locationUa: "м. Львів, вул. Новознесенська",
    locationEn: "Lviv, Novoznesenska St.",
    rooms: null,
    area: "420 м²",
    workTypeUa: "Проєкт, реалізація, омеблювання",
    workTypeEn: "Design, build-out, furnishing",
    durationUa: "8 міс.",
    durationEn: "8 mo.",
  },
  {
    id: "dtm-real-project-tiffany-1",
    titleUa: "ЖК Tiffany Apartments",
    titleEn: "Tiffany Apartments",
    objectType: "new_build",
    category: "apartment",
    locationUa: "ЖК Tiffany Apartments",
    locationEn: "Tiffany Apartments",
    rooms: 1,
    area: "42 м²",
    workTypeUa: "Проєкт, реалізація, омеблювання",
    workTypeEn: "Design, build-out, furnishing",
    durationUa: "4 міс.",
    durationEn: "4 mo.",
  },
  {
    id: "dtm-real-project-tiffany-2",
    titleUa: "ЖК Tiffany Apartments",
    titleEn: "Tiffany Apartments",
    objectType: "new_build",
    category: "apartment",
    locationUa: "ЖК Tiffany Apartments",
    locationEn: "Tiffany Apartments",
    rooms: 2,
    area: "64 м²",
    workTypeUa: "Проєкт, реалізація, омеблювання",
    workTypeEn: "Design, build-out, furnishing",
    durationUa: "6 міс.",
    durationEn: "6 mo.",
  },
  {
    id: "dtm-real-project-kvity-lvova-3",
    titleUa: "ЖК Квіти Львова",
    titleEn: "Kvity Lvova",
    objectType: "new_build",
    category: "apartment",
    locationUa: "ЖК Квіти Львова",
    locationEn: "Kvity Lvova",
    rooms: 3,
    area: "110 м²",
    workTypeUa: "Проєкт, реалізація, омеблювання",
    workTypeEn: "Design, build-out, furnishing",
    durationUa: "8 міс.",
    durationEn: "8 mo.",
  },
  {
    id: "dtm-real-project-chervonoyi-kalyny",
    titleUa: "вул. Червоної Калини",
    titleEn: "Chervonoyi Kalyny St.",
    objectType: "commercial",
    category: "commercial",
    locationUa: "м. Львів, вул. Червоної Калини",
    locationEn: "Lviv, Chervonoyi Kalyny St.",
    rooms: null,
    area: "110 м²",
    workTypeUa: "Проєкт, реалізація",
    workTypeEn: "Design and build-out",
    durationUa: "1 міс.",
    durationEn: "1 mo.",
  },
  {
    id: "dtm-real-project-shengen-2",
    titleUa: "ЖК Шенген",
    titleEn: "Schengen",
    objectType: "new_build",
    category: "apartment",
    locationUa: "ЖК Шенген",
    locationEn: "Schengen",
    rooms: 2,
    area: "70 м²",
    workTypeUa: "Проєкт, реалізація, омеблювання",
    workTypeEn: "Design, build-out, furnishing",
    durationUa: "7 міс.",
    durationEn: "7 mo.",
  },
];

function abort(message) {
  console.error(`\nABORT: ${message}\n`);
  process.exit(1);
}

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
const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
if (envDataset !== WRITE_DATASET) {
  abort(`NEXT_PUBLIC_SANITY_DATASET is ${JSON.stringify(envDataset)}, expected development`);
}
console.log("CONTENT IMPORT DATASET: development");

const client = getCliClient({ apiVersion: "2025-08-22" });
if (client.config().dataset !== WRITE_DATASET) {
  abort(`CLI dataset is ${JSON.stringify(client.config().dataset)}`);
}

for (const patch of PATCHES) {
  const existing = await client.getDocument(patch.id);
  if (!existing) abort(`Missing document ${patch.id}`);
  const slug = existing.slug?.current;
  if (!slug) abort(`Missing slug on ${patch.id}`);
  if (!existing.cover || !existing.gallery?.length) {
    abort(`Missing media on ${patch.id}`);
  }

  await client
    .patch(patch.id)
    .set({
      titleUa: patch.titleUa,
      titleEn: patch.titleEn,
      objectType: patch.objectType,
      category: patch.category,
      locationUa: patch.locationUa,
      locationEn: patch.locationEn,
      rooms: patch.rooms,
      area: patch.area,
      workTypeUa: patch.workTypeUa,
      workTypeEn: patch.workTypeEn,
      durationUa: patch.durationUa,
      durationEn: patch.durationEn,
      descriptionUa: [],
      descriptionEn: [],
      year: undefined,
    })
    .commit();

  console.log(`[patch] ${patch.id} (${slug}) → ${patch.titleUa} / ${patch.objectType}`);
}

const verify = await client.fetch(
  `*[_type == "project" && !(_id in path("drafts.**"))] | order(orderRank asc) {
    _id, titleUa, objectType, category, locationUa, rooms, area, "slug": slug.current, orderRank,
    "galleryCount": count(gallery), "hasCover": defined(cover.asset)
  }`
);
console.log("\n[verify]", verify.length, "projects");
for (const row of verify) {
  console.log(
    `  ${row.slug} | ${row.titleUa} | ${row.objectType} | rooms=${row.rooms ?? "—"} | gal=${row.galleryCount}`
  );
}
if (verify.length !== 7) abort(`Expected 7 projects, found ${verify.length}`);

const frames = await client.fetch(
  `count(*[_type == "inProgressFrame" && !(_id in path("drafts.**"))])`
);
console.log(`[in-progress safety] frames=${frames}`);
console.log("\n[normalize-portfolio-ia] PASS");
