/**
 * Selective recovery: undo prank edits on development dataset only.
 * Restores dtm-real-project-sokilnyky from pre-prank backup + legitimate naming.
 * READ pre-prank backup; WRITE one document only.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_ID = "dtm-real-project-sokilnyky";

const GOOD_TITLE = {
  titleUa: "вул. Затишна",
  titleEn: "Zatyshna St.",
};

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

function exportAssetToRef(sanityAsset) {
  if (!sanityAsset || typeof sanityAsset !== "string") return null;
  const imageMatch = sanityAsset.match(/images\/(.+)\.(\w+)$/);
  if (imageMatch) return `image-${imageMatch[1]}-${imageMatch[2]}`;
  const fileMatch = sanityAsset.match(/files\/(.+)\.(\w+)$/);
  if (fileMatch) return `file-${fileMatch[1]}-${fileMatch[2]}`;
  return null;
}

function toLiveImage(node) {
  if (!node) return undefined;
  if (node.asset?._ref) return node;
  const ref = exportAssetToRef(node._sanityAsset);
  if (!ref) return node;
  return { _type: "image", asset: { _type: "reference", _ref: ref } };
}

function toLiveGalleryItem(item) {
  const next = { ...item };
  if (item.image) next.image = toLiveImage(item.image);
  if (item.video) next.video = toLiveImage(item.video);
  return next;
}

function loadPrePrankDoc(id) {
  const extractDir = path.join(ROOT, "tmp", "recover-prank-pre");
  if (!existsSync(extractDir)) {
    abort(`Missing extracted backup at ${extractDir}. Run recovery via runner.`);
  }
  const exportDir = readdirSync(extractDir).find((d) => d.includes("export"));
  if (!exportDir) abort("No export folder in pre-prank extract");
  const ndjson = path.join(extractDir, exportDir, "data.ndjson");
  const docs = readFileSync(ndjson, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const doc = docs.find((row) => row._id === id);
  if (!doc) abort(`Document ${id} not found in pre-prank backup`);
  return doc;
}

loadEnvLocal();
const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
console.log(`RECOVERY DATASET: ${envDataset}`);
if (envDataset !== WRITE_DATASET) {
  abort(`NEXT_PUBLIC_SANITY_DATASET is ${JSON.stringify(envDataset)}, expected development`);
}

const client = getCliClient({ apiVersion: "2025-08-22" });
if (client.config().dataset !== WRITE_DATASET) {
  abort(`CLI dataset is ${JSON.stringify(client.config().dataset)}`);
}

const current = await client.getDocument(TARGET_ID);
if (!current) abort(`Missing live document ${TARGET_ID}`);

const good = loadPrePrankDoc(TARGET_ID);

const restore = {
  titleUa: GOOD_TITLE.titleUa,
  titleEn: GOOD_TITLE.titleEn,
  descriptionUa: good.descriptionUa ?? [],
  descriptionEn: good.descriptionEn ?? [],
  gallery: good.gallery.map(toLiveGalleryItem),
  cover: toLiveImage(good.cover),
  coverPosition: good.coverPosition,
};

const badPattern = /хуй|порн|porn/i;
if (badPattern.test(current.titleUa || "")) {
  console.log(`[recover] prank title detected on ${TARGET_ID}`);
}

await client.patch(TARGET_ID).set(restore).commit();
console.log(`[recover] patched ${TARGET_ID}`);

const verify = await client.fetch(
  `*[_id == $id][0]{ _id, titleUa, titleEn, descriptionUa, "gal": count(gallery) }`,
  { id: TARGET_ID }
);
console.log("[verify]", verify);

if (badPattern.test(verify.titleUa || "")) {
  abort("Prank title still present after patch");
}
if (verify.gal !== good.gallery.length) {
  abort(`Gallery count ${verify.gal} !== expected ${good.gallery.length}`);
}

// Scan all CMS docs for prank strings (published only)
const scan = await client.fetch(
  `*[_type in ["project","inProgressFrame","inProgressBoard"] && !(_id in path("drafts.**"))]`
);
const hits = [];
for (const doc of scan) {
  const text = JSON.stringify(doc);
  if (badPattern.test(text)) hits.push(doc._id);
}
if (hits.length) {
  abort(`Inappropriate content remains in: ${hits.join(", ")}`);
}

console.log("[recover-prank-edits] PASS");
