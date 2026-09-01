/**
 * Patch previewVideo on four real In-progress frames (development only).
 * Preserves full `video`, poster, titles, board — uploads only web/ preview MP4s.
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMPORT_ROOT = path.join(ROOT, "tmp", "in-progress-import");

const FRAMES = [
  { frameId: "perfect-life-60", preview: path.join(IMPORT_ROOT, "web", "perfect-life-60.mp4") },
  { frameId: "huge-lux-90", preview: path.join(IMPORT_ROOT, "web", "huge-lux-90.mp4") },
  { frameId: "natsionalnyi-70", preview: path.join(IMPORT_ROOT, "web", "natsionalnyi-70.mp4") },
  { frameId: "ms-100", preview: path.join(IMPORT_ROOT, "web", "ms-100.mp4") },
];

const BOARD_ORDER = FRAMES.map((f) => f.frameId);

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
    abort(`${label} is ${JSON.stringify(dataset)}, expected "${WRITE_DATASET}".`);
  }
}

function documentId(frameId) {
  return `dtm-in-progress-${frameId}`;
}

function sha1File(abs) {
  return createHash("sha1").update(readFileSync(abs)).digest("hex");
}

async function uploadOrReuse(client, abs, cache) {
  if (cache.has(abs)) return cache.get(abs);
  const hash = sha1File(abs);
  const existing = await client.fetch(
    `*[_type == "sanity.fileAsset" && sha1hash == $hash][0]._id`,
    { hash }
  );
  if (existing) {
    cache.set(abs, existing);
    return existing;
  }
  const asset = await client.assets.upload("file", createReadStream(abs), {
    filename: `dtm-real-ip-preview-${path.basename(abs)}`,
    contentType: "video/mp4",
  });
  cache.set(abs, asset._id);
  return asset._id;
}

async function main() {
  console.log("[patch-preview] Attach previewVideo → development In-progress frames\n");

  loadEnvLocal();
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
  if (!projectId) abort("NEXT_PUBLIC_SANITY_PROJECT_ID missing.");
  assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", configuredDataset);

  for (const row of FRAMES) {
    if (!existsSync(row.preview)) abort(`Missing preview file: ${row.preview}`);
  }

  let cliClient;
  try {
    cliClient = getCliClient({ apiVersion: "2025-08-22" });
  } catch (error) {
    abort(`Sanity CLI unavailable: ${error instanceof Error ? error.message : error}`);
  }

  const token = process.env.SANITY_AUTH_TOKEN || cliClient.config().token;
  if (!token) abort("No Sanity auth token.");

  const client = cliClient.withConfig({
    projectId,
    dataset: WRITE_DATASET,
    apiVersion: "2025-08-22",
    useCdn: false,
    token,
    perspective: "raw",
  });
  assertDevelopment("write client dataset", client.config().dataset);

  const cache = new Map();

  for (const row of FRAMES) {
    const id = documentId(row.frameId);
    const existing = await client.fetch(
      `*[_id == $id][0]{
        _id, titleUa, area,
        "video": video.asset->url,
        "previewVideo": previewVideo.asset->url
      }`,
      { id }
    );
    if (!existing?._id) abort(`Document ${id} not found in development.`);
    if (!existing.video) abort(`${id} has no full video — aborting to avoid data loss.`);

    const previewAssetId = await uploadOrReuse(client, row.preview, cache);
    await client
      .patch(id)
      .set({
        previewVideo: {
          _type: "file",
          asset: { _type: "reference", _ref: previewAssetId },
        },
      })
      .commit();

    console.log(`[patch-preview] ${row.frameId}: previewVideo=${previewAssetId}`);
    console.log(`  full video preserved: ${existing.video}`);
  }

  const verify = await client.fetch(
    `*[_type == "inProgressFrame" && frameId.current in $ids && !(_id in path("drafts.**"))]{
      _id, titleUa, area,
      "frameId": frameId.current,
      "video": video.asset->url,
      "previewVideo": previewVideo.asset->url,
      "poster": poster.asset->url
    } | order(orderRank asc)`,
    { ids: BOARD_ORDER }
  );

  const board = await client.fetch(
    `*[_id == "inProgressBoard" && !(_id in path("drafts.**"))][0]{
      "boardIds": blinds[]->frameId.current
    }`
  );

  console.log("\n[patch-preview] Read-back:");
  for (const row of verify) {
    const ok =
      row.video &&
      row.previewVideo &&
      row.video !== row.previewVideo &&
      row.poster;
    console.log(
      `  ${row.frameId}: full=${(row.video?.length ?? 0) > 0 ? "OK" : "MISSING"} preview=${row.previewVideo ? "OK" : "MISSING"} ${ok ? "PASS" : "FAIL"}`
    );
    if (!ok) abort(`Verification failed for ${row.frameId}`);
  }

  const boardIds = board?.boardIds ?? [];
  if (JSON.stringify(boardIds) !== JSON.stringify(BOARD_ORDER)) {
    abort(`Board order mismatch: ${boardIds.join(" → ")}`);
  }
  console.log(`  board: ${boardIds.join(" → ")} PASS`);
  console.log("\n[patch-preview] Done. 0 production mutations.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
