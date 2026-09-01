/**
 * Emergency removal: invalid Portfolio video on ЖК Квіти Львова (development only).
 * Removes the gallery item reference; does not delete the underlying Sanity asset.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGET_ID = "dtm-real-project-kvity-lvova-3";
const BAD_GALLERY_KEY = "46bd1deea268";
const BAD_VIDEO_ASSET_ID = "file-fe7679aab9a1569563b1874592b1c4bc82c51b54-mp4";

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

function assertDevelopment(label, dataset) {
  if (dataset !== WRITE_DATASET) {
    abort(
      `${label} is ${JSON.stringify(dataset)}, expected exactly "${WRITE_DATASET}". Production writes are forbidden.`
    );
  }
}

loadEnvLocal();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
if (!projectId) abort("NEXT_PUBLIC_SANITY_PROJECT_ID is missing.");
assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", configuredDataset);

let cliClient;
try {
  cliClient = getCliClient({ apiVersion: "2025-08-22" });
} catch (error) {
  abort(
    `Sanity CLI client is unavailable (${error instanceof Error ? error.message : error}). Run: npx sanity login`
  );
}

const token = process.env.SANITY_AUTH_TOKEN || cliClient.config().token;
if (!token) abort("No Sanity auth token. Run: npx sanity login");

const client = cliClient.withConfig({
  projectId,
  dataset: WRITE_DATASET,
  apiVersion: "2025-08-22",
  useCdn: false,
  token,
  perspective: "raw",
});

assertDevelopment("write client dataset", client.config().dataset);

const doc = await client.fetch(
  `*[_id == $id][0]{ _id, titleUa, gallery[]{ _key, image, video } }`,
  { id: TARGET_ID }
);

if (!doc?._id) {
  abort(`Published document ${TARGET_ID} not found in development.`);
}

const gallery = Array.isArray(doc.gallery) ? doc.gallery : [];
const badItems = gallery.filter(
  (item) =>
    item?._key === BAD_GALLERY_KEY ||
    item?.video?._ref === BAD_VIDEO_ASSET_ID ||
    item?.video?.asset?._ref === BAD_VIDEO_ASSET_ID
);

if (badItems.length === 0) {
  console.log(
    `[remove-kvity-video] No invalid video gallery item on ${TARGET_ID}; already clean.`
  );
  process.exit(0);
}

const cleaned = gallery.filter(
  (item) =>
    item?._key !== BAD_GALLERY_KEY &&
    item?.video?._ref !== BAD_VIDEO_ASSET_ID &&
    item?.video?.asset?._ref !== BAD_VIDEO_ASSET_ID
);

if (cleaned.length === 0) {
  abort("Refusing patch: gallery would become empty.");
}

console.log(
  `[remove-kvity-video] Removing ${badItems.length} invalid gallery item(s) from ${TARGET_ID} (${doc.titleUa})`
);
console.log(`[remove-kvity-video] Gallery ${gallery.length} → ${cleaned.length}`);

await client.patch(TARGET_ID).set({ gallery: cleaned }).commit();

const verify = await client.fetch(
  `*[_id == $id][0]{
    "videoCount": count(gallery[defined(video.asset)]),
    "galleryCount": count(gallery)
  }`,
  { id: TARGET_ID }
);

console.log(
  `[remove-kvity-video] Verified published: gallery=${verify.galleryCount}, video refs=${verify.videoCount}`
);

if (verify.videoCount !== 0) {
  abort("Post-patch verification failed: video references remain.");
}

console.log("[remove-kvity-video] DONE — development published document is clean.");
