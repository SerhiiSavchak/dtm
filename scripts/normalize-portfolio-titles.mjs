/**
 * Patch display titles for seven real development projects.
 * Preserves ids, slugs, media, orderRank, and all other fields.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TITLE_PATCHES = [
  {
    id: "dtm-real-project-novoznesenska",
    titleUa: "вул. Новознесенська",
    titleEn: "Novoznesenska St.",
  },
  {
    id: "dtm-real-project-sokilnyky",
    titleUa: "вул. Затишна",
    titleEn: "Zatyshna St.",
  },
  {
    id: "dtm-real-project-tiffany-1",
    titleUa: "ЖК Tiffany Apartments",
    titleEn: "Tiffany Apartments",
  },
  {
    id: "dtm-real-project-tiffany-2",
    titleUa: "ЖК Tiffany Apartments",
    titleEn: "Tiffany Apartments",
  },
  {
    id: "dtm-real-project-kvity-lvova-3",
    titleUa: "ЖК Квіти Львова",
    titleEn: "Kvity Lvova",
  },
  {
    id: "dtm-real-project-chervonoyi-kalyny",
    titleUa: "вул. Червоної Калини",
    titleEn: "Chervonoyi Kalyny St.",
  },
  {
    id: "dtm-real-project-shengen-2",
    titleUa: "ЖК Шенген",
    titleEn: "Schengen",
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

for (const patch of TITLE_PATCHES) {
  const existing = await client.getDocument(patch.id);
  if (!existing) abort(`Missing document ${patch.id}`);
  if (!existing.slug?.current) abort(`Missing slug on ${patch.id}`);
  if (!existing.cover || !existing.gallery?.length) {
    abort(`Missing media on ${patch.id}`);
  }

  await client
    .patch(patch.id)
    .set({ titleUa: patch.titleUa, titleEn: patch.titleEn })
    .commit();

  console.log(
    `[patch] ${patch.id} (${existing.slug.current}) → ${patch.titleUa}`
  );
}

const verify = await client.fetch(
  `*[_type == "project" && !(_id in path("drafts.**"))] | order(orderRank asc) {
    _id, titleUa, "slug": slug.current, orderRank,
    "galleryCount": count(gallery), "hasCover": defined(cover.asset)
  }`
);
console.log("\n[verify]", verify.length, "projects");
for (const row of verify) {
  console.log(`  ${row.slug} | ${row.titleUa} | gal=${row.galleryCount}`);
}
if (verify.length !== 7) abort(`Expected 7 projects, found ${verify.length}`);

const frames = await client.fetch(
  `count(*[_type == "inProgressFrame" && !(_id in path("drafts.**"))])`
);
console.log(`[in-progress safety] frames=${frames}`);
console.log("\n[normalize-portfolio-titles] PASS");
