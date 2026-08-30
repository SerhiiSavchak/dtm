/**
 * Development-only seed for three Portfolio test projects.
 * Mutations are hardcoded to dataset "development" after an env/CLI safety check.
 * There is no --dataset flag and no way to target production.
 */
import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LexoRank } from "lexorank";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const SEED_IDS = [
  "dtm-test-project-01",
  "dtm-test-project-02",
  "dtm-test-project-03",
];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function abort(message) {
  console.error(`\nABORT: ${message}\nNo Sanity mutations were sent.\n`);
  process.exit(1);
}

function loadEnvLocal() {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
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

function assertDevelopment(label, dataset) {
  if (dataset !== WRITE_DATASET) {
    abort(
      `${label} is ${JSON.stringify(dataset)}, expected exactly "${WRITE_DATASET}". This seed cannot write to production or any other dataset.`
    );
  }
}

function imagePath(name) {
  const file = path.join(ROOT, "public", "images", name);
  if (!existsSync(file)) abort(`Missing local image: public/images/${name}`);
  return file;
}

function seedRanks() {
  // Same strategy as @sanity/orderable-document-list initialRank (genNext twice).
  let rank = LexoRank.min().genNext().genNext();
  return SEED_IDS.map(() => {
    const value = rank.toString();
    rank = LexoRank.parse(value).genNext().genNext();
    return value;
  });
}

function imageField(assetId) {
  return {
    _type: "image",
    asset: { _type: "reference", _ref: assetId },
  };
}

function galleryItem(key, assetId, fit, objectPosition, thumbPosition) {
  return {
    _type: "projectMedia",
    _key: key,
    image: imageField(assetId),
    fit,
    objectPosition,
    thumbPosition,
  };
}

const PROJECTS = [
  {
    _id: "dtm-test-project-01",
    titleUa: "TEST 01",
    titleEn: "TEST 01 EN",
    slug: "test-01",
    category: "apartment",
    locationKey: "lviv",
    descriptionUa: [
      "Тестовий опис першого проєкту.",
      "Другий абзац для перевірки модального вікна.",
    ],
    descriptionEn: ["Test description for the first project."],
    area: "52 м²",
    workTypeUa: "Тестовий ремонт",
    workTypeEn: "Test renovation",
    durationUa: "3 місяці",
    durationEn: "3 months",
    year: "2026",
    span: "large",
    coverPosition: "center center",
    coverFile: "photo_2026-08-09_15-10-55.jpg",
    gallery: [
      {
        file: "photo_2026-08-09_15-10-13.jpg",
        fit: "contain",
        objectPosition: "center center",
        thumbPosition: "center 20%",
      },
      {
        file: "photo_2026-08-09_15-10-16.jpg",
        fit: "cover",
        objectPosition: "center 40%",
        thumbPosition: "center 40%",
      },
      {
        file: "photo_2026-08-09_15-10-19.jpg",
        fit: "contain",
        objectPosition: "center top",
        thumbPosition: "center 10%",
      },
    ],
  },
  {
    _id: "dtm-test-project-02",
    titleUa: "TEST 02",
    titleEn: undefined,
    slug: "test-02",
    category: "house",
    locationKey: "lviv",
    descriptionUa: ["Тестовий опис другого проєкту без англійського тексту."],
    descriptionEn: undefined,
    area: "78 м²",
    workTypeUa: "Чистове оздоблення",
    workTypeEn: undefined,
    durationUa: "4 місяці",
    durationEn: undefined,
    year: "2025",
    span: "small",
    coverPosition: "center 36%",
    coverFile: "photo_2026-08-09_15-12-03.jpg",
    gallery: [
      {
        file: "photo_2026-08-09_15-10-51.jpg",
        fit: "contain",
        objectPosition: "center center",
        thumbPosition: "center 30%",
      },
      {
        file: "photo_2026-08-09_15-12-25.jpg",
        fit: "cover",
        objectPosition: "70% 52%",
        thumbPosition: "70% 52%",
      },
      {
        file: "photo_2026-08-09_15-11-27.jpg",
        fit: "contain",
        objectPosition: "center 42%",
        thumbPosition: "center 42%",
      },
    ],
  },
  {
    _id: "dtm-test-project-03",
    titleUa: "TEST 03",
    titleEn: "TEST 03 EN",
    slug: "test-03",
    category: "commercial",
    locationKey: "lviv",
    descriptionUa: ["Тестовий комерційний проєкт для перевірки span wide."],
    descriptionEn: ["Commercial test project for the wide card span."],
    area: "120 м²",
    workTypeUa: "Комплексний ремонт",
    workTypeEn: "Full-cycle renovation",
    durationUa: "5 місяців",
    durationEn: "5 months",
    year: "2024",
    span: "wide",
    coverPosition: "center 32%",
    coverFile: "photo_2026-08-09_15-10-27.jpg",
    gallery: [
      {
        file: "photo_2026-08-09_15-10-06.jpg",
        fit: "contain",
        objectPosition: "center center",
        thumbPosition: "center 18%",
      },
      {
        file: "photo_2026-08-09_15-10-34.jpg",
        fit: "cover",
        objectPosition: "center 36%",
        thumbPosition: "center 36%",
      },
      {
        file: "photo_2026-08-09_15-10-43.jpg",
        fit: "contain",
        objectPosition: "center 28%",
        thumbPosition: "center 28%",
      },
    ],
  },
];

async function uploadOrReuse(client, fileName) {
  const seedName = `dtm-seed-${fileName}`;
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename == $name][0]._id`,
    { name: seedName }
  );
  if (existing) return existing;

  const asset = await client.assets.upload(
    "image",
    createReadStream(imagePath(fileName)),
    { filename: seedName }
  );
  return asset._id;
}

async function main() {
  console.log("[seed] Starting DTM Sanity test seed");

  if (process.argv.some((arg) => arg === "--dataset" || arg.startsWith("--dataset="))) {
    abort("This seed does not accept dataset overrides.");
  }

  loadEnvLocal();

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";

  console.log(`[seed] Project: ${projectId || "(missing)"}`);
  console.log(`[seed] Dataset: ${configuredDataset || "(missing)"}`);
  if (!projectId) abort("NEXT_PUBLIC_SANITY_PROJECT_ID is missing.");
  assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", configuredDataset);
  console.log("[seed] Safety check passed\n");

  let cliClient;
  try {
    cliClient = getCliClient({ apiVersion: "2025-08-22" });
  } catch (error) {
    abort(
      `Sanity CLI client is unavailable (${error instanceof Error ? error.message : error}). Run: npx sanity login`
    );
  }

  const cliDataset = cliClient.config().dataset;
  if (cliDataset) assertDevelopment("Sanity CLI client dataset", cliDataset);

  const token = process.env.SANITY_AUTH_TOKEN || cliClient.config().token;
  if (!token) {
    abort("No Sanity auth token. Run: npx sanity login");
  }

  const client = cliClient.withConfig({
    projectId,
    dataset: WRITE_DATASET,
    apiVersion: "2025-08-22",
    useCdn: false,
    token,
    perspective: "raw",
  });

  assertDevelopment("write client dataset", client.config().dataset);
  if (client.config().projectId !== projectId) {
    abort("Write client project ID does not match NEXT_PUBLIC_SANITY_PROJECT_ID.");
  }

  const existing = await client.fetch(
    `*[_type == "project" && _id in $ids] | order(orderRank asc) {
      _id, titleUa, "slug": slug.current, orderRank
    }`,
    { ids: SEED_IDS }
  );
  console.log("[seed] Existing seed documents before write:", existing.length);
  for (const row of existing) {
    console.log(`  ${row._id} ${row.titleUa} ${row.slug} ${row.orderRank}`);
  }

  console.log("\nUploading test assets...");
  const ranks = seedRanks();
  const fileIds = new Map();
  for (const project of PROJECTS) {
    const files = [project.coverFile, ...project.gallery.map((item) => item.file)];
    for (const file of files) {
      if (fileIds.has(file)) continue;
      fileIds.set(file, await uploadOrReuse(client, file));
    }
  }

  for (const [index, project] of PROJECTS.entries()) {
    console.log(`Creating ${project.titleUa}...`);
    const coverAssetId = fileIds.get(project.coverFile);
    const doc = {
      _id: project._id,
      _type: "project",
      titleUa: project.titleUa,
      ...(project.titleEn ? { titleEn: project.titleEn } : {}),
      slug: { _type: "slug", current: project.slug },
      category: project.category,
      locationKey: project.locationKey,
      descriptionUa: project.descriptionUa,
      ...(project.descriptionEn ? { descriptionEn: project.descriptionEn } : {}),
      area: project.area,
      workTypeUa: project.workTypeUa,
      ...(project.workTypeEn ? { workTypeEn: project.workTypeEn } : {}),
      durationUa: project.durationUa,
      ...(project.durationEn ? { durationEn: project.durationEn } : {}),
      year: project.year,
      span: project.span,
      coverPosition: project.coverPosition,
      cover: imageField(coverAssetId),
      gallery: project.gallery.map((item, galleryIndex) =>
        galleryItem(
          `${project.slug}-g${galleryIndex + 1}`,
          fileIds.get(item.file),
          item.fit,
          item.objectPosition,
          item.thumbPosition
        )
      ),
      orderRank: ranks[index],
    };

    await client.delete(`drafts.${project._id}`).catch(() => undefined);
    await client.createOrReplace(doc);
  }

  const verifyQuery = `*[_type == "project" && _id in $ids] | order(orderRank asc) {
    _id,
    titleUa,
    "slug": slug.current,
    span,
    category,
    orderRank,
    "published": !(_id in path("drafts.**")),
    "galleryCount": count(gallery),
    "hasCover": defined(cover.asset)
  }`;

  const rows = await client.fetch(verifyQuery, { ids: SEED_IDS });
  const extra = await client.fetch(
    `count(*[_type == "project" && _id in $ids])`,
    { ids: [...SEED_IDS, ...SEED_IDS.map((id) => `drafts.${id}`)] }
  );

  console.log("\nSanity development verification\n");
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.titleUa}`);
    console.log(`   id: ${row._id}`);
    console.log(`   slug: ${row.slug}`);
    console.log(`   span: ${row.span}`);
    console.log(`   category: ${row.category}`);
    console.log(`   orderRank: ${row.orderRank}`);
    console.log(`   gallery: ${row.galleryCount}`);
    console.log(`   published: ${row.published ? "yes" : "no"}`);
    console.log("");
  });

  const orderOk =
    rows.length === 3 &&
    rows[0]?.titleUa === "TEST 01" &&
    rows[1]?.titleUa === "TEST 02" &&
    rows[2]?.titleUa === "TEST 03" &&
    rows.every(
      (row) =>
        row.published &&
        row.hasCover &&
        row.galleryCount >= 2 &&
        typeof row.orderRank === "string" &&
        row.orderRank.length > 0
    );

  if (!orderOk) abort("Verification failed: unexpected documents, order, or missing orderRank.");
  if (extra !== 3) {
    abort(`Expected exactly 3 seed documents, found ${extra} including drafts.`);
  }

  const twoHasEn = await client.fetch(
    `*[_id == "dtm-test-project-02"][0]{ titleEn, workTypeEn, durationEn, descriptionEn }`
  );
  if (
    twoHasEn?.titleEn ||
    twoHasEn?.workTypeEn ||
    twoHasEn?.durationEn ||
    (Array.isArray(twoHasEn?.descriptionEn) && twoHasEn.descriptionEn.length > 0)
  ) {
    abort("TEST 02 must not have English fields.");
  }

  const publishedClient = client.withConfig({ perspective: "published" });
  const published = await publishedClient.fetch(
    `*[_type == "project" && !(_id in path("drafts.**"))] | order(orderRank asc) {
      _id, titleUa, "slug": slug.current, orderRank
    }`
  );
  const seedPublished = published.filter((row) => SEED_IDS.includes(row._id));
  console.log(
    "Published seed order:",
    seedPublished.map((row) => row.titleUa).join(" → ")
  );
  if (
    seedPublished.length !== 3 ||
    seedPublished[0]?.titleUa !== "TEST 01" ||
    seedPublished[1]?.titleUa !== "TEST 02" ||
    seedPublished[2]?.titleUa !== "TEST 03"
  ) {
    abort("Published GROQ order is not TEST 01 → TEST 02 → TEST 03.");
  }

  const layerDocs = await publishedClient.fetch(
    `*[_type == "project"
      && !(_id in path("drafts.**"))
      && defined(slug.current)
      && defined(cover.asset)
      && count(gallery) > 0
    ] | order(orderRank asc) { titleUa, "slug": slug.current }`
  );
  const layerSlugs = (layerDocs ?? []).map((row) => row.slug);
  const i1 = layerSlugs.indexOf("test-01");
  const i2 = layerSlugs.indexOf("test-02");
  const i3 = layerSlugs.indexOf("test-03");
  console.log(
    "Portfolio GROQ titles:",
    (layerDocs ?? []).map((row) => row.titleUa).join(" → ")
  );
  if (i1 < 0 || i2 < 0 || i3 < 0 || !(i1 < i2 && i2 < i3) || layerDocs.length < 3) {
    abort("Website GROQ did not return TEST 01 / 02 / 03 in order (fallback would still be active).");
  }
  console.log("Hardcoded fallback: inactive (Sanity returned published test projects)");

  console.log("\nWrite dataset confirmed:", client.config().dataset);
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
