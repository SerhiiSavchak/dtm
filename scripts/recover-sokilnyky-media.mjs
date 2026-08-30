/**
 * Fix sokilnyky asset refs after NDJSON restore used export _sanityAsset format.
 * Converts to live asset._ref, keeps legitimate naming, 12-item pre-prank gallery.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_ID = "dtm-real-project-sokilnyky";

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
  if (imageMatch) {
    return `image-${imageMatch[1]}-${imageMatch[2]}`;
  }
  const fileMatch = sanityAsset.match(/files\/(.+)\.(\w+)$/);
  if (fileMatch) {
    return `file-${fileMatch[1]}-${fileMatch[2]}`;
  }
  return null;
}

function toLiveImage(node) {
  if (!node) return undefined;
  if (node.asset?._ref) return node;
  const ref = exportAssetToRef(node._sanityAsset);
  if (!ref) return node;
  return { _type: "image", asset: { _type: "reference", _ref: ref } };
}

function toLiveFile(node) {
  if (!node) return undefined;
  if (node.asset?._ref) return node;
  const ref = exportAssetToRef(node._sanityAsset);
  if (!ref) return node;
  return { _type: "file", asset: { _type: "reference", _ref: ref } };
}

function toLiveGalleryItem(item) {
  const next = { ...item };
  if (item.image) next.image = toLiveImage(item.image);
  if (item.video) next.video = toLiveFile(item.video);
  return next;
}

function loadPrePrankDoc(id) {
  const extractDir = path.join(ROOT, "tmp", "recover-prank-pre");
  const exportDir = readdirSync(extractDir).find((d) => d.includes("export"));
  const ndjson = path.join(extractDir, exportDir, "data.ndjson");
  const doc = readFileSync(ndjson, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line))
    .find((row) => row._id === id);
  if (!doc) abort(`Document ${id} missing in pre-prank backup`);
  return doc;
}

loadEnvLocal();
console.log(`RECOVERY DATASET: ${process.env.NEXT_PUBLIC_SANITY_DATASET || ""}`);
if ((process.env.NEXT_PUBLIC_SANITY_DATASET || "") !== WRITE_DATASET) {
  abort("Dataset must be development");
}

const client = getCliClient({ apiVersion: "2025-08-22" });
if (client.config().dataset !== WRITE_DATASET) abort("CLI dataset mismatch");

const prePrank = loadPrePrankDoc(TARGET_ID);
const gallery = prePrank.gallery.map(toLiveGalleryItem);
const cover = toLiveImage(prePrank.cover);

await client
  .patch(TARGET_ID)
  .set({
    titleUa: "вул. Затишна",
    titleEn: "Zatyshna St.",
    descriptionUa: [],
    descriptionEn: [],
    cover,
    coverPosition: prePrank.coverPosition,
    gallery,
  })
  .commit();

const verify = await client.fetch(
  `*[_id == $id][0]{
    titleUa,
    "hasCover": defined(cover.asset),
    "gal": count(gallery),
    "galWithImage": count(gallery[defined(image.asset)])
  }`,
  { id: TARGET_ID }
);
console.log("[verify]", verify);

if (!verify.hasCover || verify.gal !== 12 || verify.galWithImage !== 12) {
  abort("Media refs still broken after media fix");
}

console.log("[recover-sokilnyky-media] PASS");
