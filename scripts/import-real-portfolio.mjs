/**
 * Import curated real Portfolio projects into Sanity dataset "development".
 * Idempotent. Does NOT touch In-progress. Does NOT write production.
 * Does NOT delete demo projects — pass --purge-demo after successful verify.
 */
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  readFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LexoRank } from "lexorank";
import { getCliClient } from "sanity/cli";
import {
  REAL_PORTFOLIO_DISPLAY_ORDER,
  REAL_PORTFOLIO_PROJECTS,
  realProjectDocumentId,
} from "./real-portfolio-projects.mjs";

const WRITE_DATASET = "development";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "public", "new-materials");
const NORM = path.join(ROOT, "tmp", "real-portfolio-import", "normalized");

const DEMO_ID_PREFIX = "dtm-project-";
const REAL_ID_PREFIX = "dtm-real-project-";

function abort(message) {
  console.error(`\nABORT: ${message}\nNo further Sanity mutations will be sent.\n`);
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

function assertDevelopment(label, dataset) {
  if (dataset !== WRITE_DATASET) {
    abort(
      `${label} is ${JSON.stringify(dataset)}, expected exactly "${WRITE_DATASET}".`
    );
  }
}

function ranksForCount(count) {
  let rank = LexoRank.min().genNext().genNext();
  const values = [];
  for (let i = 0; i < count; i += 1) {
    values.push(rank.toString());
    rank = LexoRank.parse(rank.toString()).genNext().genNext();
  }
  return values;
}

function sha1File(abs) {
  return createHash("sha1").update(readFileSync(abs)).digest("hex");
}

function resolveUploadPath(folder, filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".heic" || ext === ".heif") {
    const jpg = path.join(NORM, folder, `${path.parse(filename).name}.jpg`);
    if (!existsSync(jpg)) {
      abort(
        `Normalized JPEG missing for ${folder}/${filename}. Run: node scripts/inventory-real-portfolio.mjs`
      );
    }
    return jpg;
  }
  const original = path.join(SOURCE, folder, filename);
  if (!existsSync(original)) {
    abort(`Source file missing: ${folder}/${filename}`);
  }
  return original;
}

function imageField(assetId) {
  return {
    _type: "image",
    asset: { _type: "reference", _ref: assetId },
  };
}

function galleryItem(assetId, key) {
  return {
    _type: "projectMedia",
    _key: key,
    image: imageField(assetId),
    fit: "contain",
    objectPosition: "center center",
    thumbPosition: "center center",
  };
}

async function uploadOrReuseImage(client, abs, cache, stats) {
  if (cache.has(abs)) {
    stats.reused += 1;
    return cache.get(abs);
  }
  const hash = sha1File(abs);
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && sha1hash == $hash][0]._id`,
    { hash }
  );
  if (existing) {
    cache.set(abs, existing);
    stats.reused += 1;
    return existing;
  }
  const filename = `dtm-real-${path.basename(abs)}`;
  const asset = await client.assets.upload("image", createReadStream(abs), {
    filename,
  });
  cache.set(abs, asset._id);
  stats.uploaded += 1;
  return asset._id;
}

function printMapping() {
  console.log("\nResolved mapping (folder → project number → title):");
  for (const p of REAL_PORTFOLIO_PROJECTS) {
    console.log(`  ${p.folder} → ${p.projectNumber} → ${p.titleUa}`);
  }
  console.log(
    `\nDisplay order (lead first): ${REAL_PORTFOLIO_DISPLAY_ORDER.join(" → ")}`
  );
}

async function purgeDemoProjects(client) {
  const all = await client.fetch(
    `*[_type == "project" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current, titleUa }`
  );
  const demos = all.filter((d) => {
    const id = String(d._id);
    return id.startsWith(DEMO_ID_PREFIX) && !id.startsWith(REAL_ID_PREFIX);
  });
  const realCount = all.filter((d) => String(d._id).startsWith(REAL_ID_PREFIX)).length;
  if (realCount !== 7) {
    abort(`Expected 7 real projects before purge, found ${realCount}.`);
  }
  console.log(`[purge-demo] deleting ${demos.length} demo project docs…`);
  for (const doc of demos) {
    const id = String(doc._id);
    if (!id.startsWith(DEMO_ID_PREFIX) || id.startsWith(REAL_ID_PREFIX)) {
      abort(`Refusing to delete ${id}`);
    }
    await client.delete(id);
    console.log(`  deleted ${id} (${doc.slug})`);
  }
}

async function main() {
  loadEnvLocal();
  const purgeDemo = process.argv.includes("--purge-demo");

  const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
  assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", envDataset);
  console.log("CONTENT IMPORT DATASET: development");

  printMapping();

  if (!existsSync(SOURCE)) abort(`Missing ${SOURCE}`);
  for (const p of REAL_PORTFOLIO_PROJECTS) {
    if (!existsSync(path.join(SOURCE, p.folder))) {
      abort(`Missing folder ${p.folder}`);
    }
  }

  const client = getCliClient({ apiVersion: "2025-08-22" });
  assertDevelopment("CLI client.config().dataset", client.config().dataset);

  if (purgeDemo && !process.argv.includes("--import")) {
    // purge-only mode after prior successful import
    await purgeDemoProjects(client);
    const remaining = await client.fetch(
      `*[_type == "project" && !(_id in path("drafts.**"))] | order(orderRank asc) { _id, "slug": slug.current, titleUa }`
    );
    console.log(`\nRemaining projects: ${remaining.length}`);
    for (const row of remaining) console.log(`  ${row._id} ${row.slug} — ${row.titleUa}`);
    if (remaining.length !== 7) {
      abort(`Expected exactly 7 projects after purge, found ${remaining.length}`);
    }
    const unexpected = remaining.filter(
      (r) => !String(r._id).startsWith(REAL_ID_PREFIX)
    );
    if (unexpected.length) {
      abort(`Non-real projects remain: ${unexpected.map((r) => r._id).join(", ")}`);
    }
    console.log("[purge-demo] PASS");
    return;
  }

  const byNumber = new Map(
    REAL_PORTFOLIO_PROJECTS.map((p) => [p.projectNumber, p])
  );
  const ordered = REAL_PORTFOLIO_DISPLAY_ORDER.map((n) => {
    const p = byNumber.get(n);
    if (!p) abort(`Display order references missing project ${n}`);
    return p;
  });
  if (ordered.length !== 7) abort("Display order must contain 7 projects.");

  const ranks = ranksForCount(ordered.length);
  const cache = new Map();
  const stats = { uploaded: 0, reused: 0, created: 0, updated: 0 };

  for (let i = 0; i < ordered.length; i += 1) {
    const project = ordered[i];
    const docId = realProjectDocumentId(project.idKey);
    console.log(`\n[${i + 1}/7] ${project.titleUa} (${docId})`);

    const coverAbs = resolveUploadPath(project.folder, project.cover);
    const coverAssetId = await uploadOrReuseImage(client, coverAbs, cache, stats);

    const gallery = [];
    for (let g = 0; g < project.gallery.length; g += 1) {
      const name = project.gallery[g];
      const abs = resolveUploadPath(project.folder, name);
      const assetId = await uploadOrReuseImage(client, abs, cache, stats);
      gallery.push(galleryItem(assetId, `g${String(g + 1).padStart(2, "0")}`));
    }

    const existing = await client.getDocument(docId).catch(() => null);
    const doc = {
      _id: docId,
      _type: "project",
      titleUa: project.titleUa,
      titleEn: project.titleEn,
      slug: { _type: "slug", current: project.slug },
      category: project.category,
      locationUa: project.locationUa,
      locationEn: project.locationEn,
      rooms: project.rooms,
      area: project.area,
      workTypeUa: project.workTypeUa,
      workTypeEn: project.workTypeEn,
      durationUa: project.durationUa,
      durationEn: project.durationEn,
      descriptionUa: [],
      descriptionEn: [],
      year: undefined,
      cover: imageField(coverAssetId),
      coverPosition: project.coverPosition,
      gallery,
      span: "small",
      orderRank: ranks[i],
      locationKey: "lviv",
    };

    await client.createOrReplace(doc);
    if (existing) stats.updated += 1;
    else stats.created += 1;
    console.log(
      `  cover=${project.cover} gallery=${gallery.length} orderRank set`
    );
  }

  const live = await client.fetch(
    `*[_type == "project" && !(_id in path("drafts.**")) && _id match $prefix] | order(orderRank asc) {
      _id, titleUa, "slug": slug.current, category, locationUa, rooms, area, workTypeUa, durationUa, year,
      "coverUrl": cover.asset->url,
      "galleryCount": count(gallery)
    }`,
    { prefix: `${REAL_ID_PREFIX}*` }
  );

  console.log("\n[verify] real projects from GROQ:");
  for (const row of live) {
    console.log(
      `  ${row.slug} | ${row.category} | rooms=${row.rooms ?? "—"} | gal=${row.galleryCount} | year=${row.year ?? "null"} | ${row.locationUa}`
    );
    if (row.year) abort(`Year must be empty for ${row.slug}`);
    if (!row.coverUrl?.includes("cdn.sanity.io")) {
      abort(`Cover not on Sanity CDN for ${row.slug}`);
    }
  }
  if (live.length !== 7) abort(`Expected 7 real projects, found ${live.length}`);

  const frames = await client.fetch(
    `count(*[_type == "inProgressFrame" && !(_id in path("drafts.**"))])`
  );
  const board = await client.fetch(
    `*[_id == "inProgressBoard"][0]{ "refs": blinds[]->_id }`
  );
  console.log(`\n[in-progress safety] frames=${frames} board=${(board?.refs || []).join(" → ")}`);
  if (frames !== 10) {
    console.warn("WARN: in-progress frame count changed unexpectedly.");
  }

  console.log("\n[stats]", stats);
  console.log(
    "\nImport of 7 real projects complete. Demo docs still present until --purge-demo."
  );
  console.log(
    "Next: verify frontend, then: npx sanity exec scripts/import-real-portfolio.mjs --with-user-token -- --purge-demo"
  );
}

await main();
