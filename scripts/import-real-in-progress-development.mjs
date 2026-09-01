/**
 * Import the four real In-progress videos from tmp/in-progress-import into
 * Sanity dataset "development" only. Idempotent createOrReplace.
 *
 * Source originals stay in public/in-progress/ untouched.
 * Uploaded media are web H.264 derivatives + selected posters under tmp/.
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LexoRank } from "lexorank";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const BOARD_ID = "inProgressBoard";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMPORT_ROOT = path.join(ROOT, "tmp", "in-progress-import");

/**
 * Editorial board order (visual contrast: warm brick → technical floor →
 * bright depth → plaster electrical).
 */
const OBJECTS = [
  {
    frameId: "perfect-life-60",
    label: "ЖК Perfect Life 60 м.кв.",
    sourceOriginal: "ЖК Perfect Life 60 м.кв.MP4",
    video: path.join(IMPORT_ROOT, "web", "perfect-life-60.mp4"),
    poster: path.join(IMPORT_ROOT, "selected", "perfect-life-60.jpg"),
    posterPct: 20,
    objectPosition: "center center",
  },
  {
    frameId: "huge-lux-90",
    label: "ЖК Huge Lux 90 м.кв.",
    sourceOriginal: "ЖК Huge Lux 90 м.кв.MOV",
    video: path.join(IMPORT_ROOT, "web", "huge-lux-90.mp4"),
    poster: path.join(IMPORT_ROOT, "selected", "huge-lux-90.jpg"),
    posterPct: 20,
    objectPosition: "center center",
  },
  {
    frameId: "natsionalnyi-70",
    label: "ЖК Національний 70 м.кв.",
    sourceOriginal: "ЖК Національний 70 м. кв.MOV",
    video: path.join(IMPORT_ROOT, "web", "natsionalnyi-70.mp4"),
    poster: path.join(IMPORT_ROOT, "selected", "natsionalnyi-70.jpg"),
    posterPct: 45,
    objectPosition: "center center",
  },
  {
    frameId: "ms-100",
    label: "ЖК MS 100 м.кв.",
    sourceOriginal: "ЖК MS 100 м.кв.MP4",
    video: path.join(IMPORT_ROOT, "web", "ms-100.mp4"),
    poster: path.join(IMPORT_ROOT, "selected", "ms-100.jpg"),
    posterPct: 20,
    objectPosition: "center center",
  },
];

const BOARD_ORDER = OBJECTS.map((o) => o.frameId);

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

function documentId(frameId) {
  return `dtm-in-progress-${frameId}`;
}

function sha1File(abs) {
  return createHash("sha1").update(readFileSync(abs)).digest("hex");
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

function imageField(assetId) {
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

function fileField(assetId) {
  return { _type: "file", asset: { _type: "reference", _ref: assetId } };
}

async function uploadOrReuse(client, kind, abs, cache, stats) {
  const cacheKey = `${kind}:${abs}`;
  if (cache.has(cacheKey)) {
    stats[kind].reused += 1;
    return cache.get(cacheKey);
  }
  const hash = sha1File(abs);
  const type = kind === "image" ? "sanity.imageAsset" : "sanity.fileAsset";
  const existing = await client.fetch(
    `*[_type == $type && sha1hash == $hash][0]._id`,
    { type, hash }
  );
  if (existing) {
    cache.set(cacheKey, existing);
    stats[kind].reused += 1;
    return existing;
  }
  const filename = `dtm-real-ip-${path.basename(abs)}`;
  const asset = await client.assets.upload(
    kind,
    createReadStream(abs),
    kind === "file"
      ? { filename, contentType: "video/mp4" }
      : { filename, contentType: "image/jpeg" }
  );
  cache.set(cacheKey, asset._id);
  stats[kind].uploaded += 1;
  return asset._id;
}

async function main() {
  console.log("[import-real-ip] Real In-progress → Sanity development\n");

  if (process.argv.some((arg) => arg === "--dataset" || arg.startsWith("--dataset="))) {
    abort("This import does not accept dataset overrides.");
  }

  loadEnvLocal();
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
  console.log(`[import-real-ip] Project: ${projectId || "(missing)"}`);
  console.log(`[import-real-ip] Dataset: ${configuredDataset || "(missing)"}`);
  if (!projectId) abort("NEXT_PUBLIC_SANITY_PROJECT_ID is missing.");
  assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", configuredDataset);

  for (const obj of OBJECTS) {
    if (!existsSync(obj.video)) abort(`Missing web video: ${obj.video}`);
    if (!existsSync(obj.poster)) abort(`Missing poster: ${obj.poster}`);
    const original = path.join(ROOT, "public", "in-progress", obj.sourceOriginal);
    if (!existsSync(original)) abort(`Missing original source: ${original}`);
  }
  console.log("[import-real-ip] Preflight: 4 web videos + 4 posters + originals OK\n");

  let cliClient;
  try {
    cliClient = getCliClient({ apiVersion: "2025-08-22" });
  } catch (error) {
    abort(
      `Sanity CLI client unavailable (${error instanceof Error ? error.message : error}).`
    );
  }
  const cliDataset = cliClient.config().dataset;
  if (cliDataset) assertDevelopment("Sanity CLI client dataset", cliDataset);
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

  const cache = new Map();
  const stats = {
    image: { uploaded: 0, reused: 0 },
    file: { uploaded: 0, reused: 0 },
  };
  const ranks = ranksForCount(OBJECTS.length);

  for (const [index, obj] of OBJECTS.entries()) {
    const id = documentId(obj.frameId);
    console.log(`[import-real-ip] ${index + 1}/4 ${obj.frameId} → ${id}`);
    const videoAssetId = await uploadOrReuse(client, "file", obj.video, cache, stats);
    const posterAssetId = await uploadOrReuse(client, "image", obj.poster, cache, stats);
    const doc = {
      _id: id,
      _type: "inProgressFrame",
      label: obj.label,
      mediaType: "video",
      frameId: { _type: "slug", current: obj.frameId },
      video: fileField(videoAssetId),
      poster: imageField(posterAssetId),
      objectPosition: obj.objectPosition,
      orderRank: ranks[index],
    };
    await client.delete(`drafts.${id}`).catch(() => undefined);
    await client.createOrReplace(doc);
    console.log(`  poster@${obj.posterPct}%  video=${videoAssetId}`);
  }

  const boardDoc = {
    _id: BOARD_ID,
    _type: "inProgressBoard",
    blinds: BOARD_ORDER.map((frameId) => ({
      _type: "reference",
      _key: `blind-${frameId}`,
      _ref: documentId(frameId),
    })),
  };
  console.log(`[import-real-ip] Writing board ${BOARD_ID}: ${BOARD_ORDER.join(" → ")}`);
  await client.delete(`drafts.${BOARD_ID}`).catch(() => undefined);
  await client.createOrReplace(boardDoc);

  const stored = await client.fetch(
    `*[_type == "inProgressFrame" && frameId.current in $ids && !(_id in path("drafts.**"))]{
      _id, "frameId": frameId.current, mediaType,
      "video": video.asset->url, "poster": poster.asset->url
    }`,
    { ids: BOARD_ORDER }
  );
  const board = await client.fetch(
    `*[_id == $id && !(_id in path("drafts.**"))][0]{ "boardIds": blinds[]->frameId.current }`,
    { id: BOARD_ID }
  );

  let failed = false;
  for (const frameId of BOARD_ORDER) {
    const row = stored.find((r) => r.frameId === frameId);
    if (!row) {
      failed = true;
      console.error(`  FAIL missing ${frameId}`);
      continue;
    }
    const okVideo = /^https:\/\/cdn\.sanity\.io\/files\//.test(row.video || "");
    const okPoster = /^https:\/\/cdn\.sanity\.io\/images\//.test(row.poster || "");
    if (row.mediaType !== "video" || !okVideo || !okPoster) {
      failed = true;
      console.error(`  FAIL ${frameId} mediaType/video/poster`);
    } else {
      console.log(`  PASS ${frameId}`);
    }
  }
  const resolved = board?.boardIds ?? [];
  if (JSON.stringify(resolved) !== JSON.stringify(BOARD_ORDER)) {
    failed = true;
    console.error(`  FAIL board ${resolved.join(" → ")}`);
  } else {
    console.log(`  PASS board ${resolved.join(" → ")}`);
  }

  console.log(
    `\n[import-real-ip] Images uploaded=${stats.image.uploaded} reused=${stats.image.reused}`
  );
  console.log(
    `[import-real-ip] Videos uploaded=${stats.file.uploaded} reused=${stats.file.reused}`
  );
  console.log(`[import-real-ip] Write dataset confirmed: ${client.config().dataset}`);
  console.log("[import-real-ip] 0 mutations sent to production");
  console.log(
    "[import-real-ip] public/in-progress/ originals preserved (not deleted)"
  );

  if (failed) abort("Read-back verification failed.");
  console.log("[import-real-ip] Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
