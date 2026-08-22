/**
 * Migrate hardcoded In-progress frames + 4-panel board into Sanity
 * dataset "development" only. No dataset CLI override. No production writes.
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { LexoRank } from "lexorank";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const BOARD_ID = "inProgressBoard";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

register(pathToFileURL(path.join(ROOT, "scripts/ts-ext-hooks.mjs")).href, import.meta.url);

const FRAMES_QUERY = `
*[_type == "inProgressFrame"
  && !(_id in path("drafts.**"))
  && defined(frameId.current)
  && defined(still.asset)
] | order(orderRank asc) {
  _id,
  "frameId": frameId.current,
  objectPosition,
  orderRank,
  "src": still.asset->url,
  "stillAssetId": still.asset._ref,
  "video": video.asset->url,
  "videoAssetId": video.asset._ref
}
`;

const BOARD_QUERY = `
*[_id == $id && !(_id in path("drafts.**"))][0] {
  "boardIds": blinds[]->frameId.current,
  "boardRefs": blinds[]._ref
}
`;

function abort(message) {
  console.error(`\nABORT: ${message}\nNo further Sanity mutations will be sent.\n`);
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
      `${label} is ${JSON.stringify(dataset)}, expected exactly "${WRITE_DATASET}". This migration cannot write to production or any other dataset.`
    );
  }
}

function publicFileFromWebPath(webPath) {
  if (!webPath || typeof webPath !== "string" || !webPath.startsWith("/")) {
    return { webPath, abs: null, ok: false, reason: "path is not a site-root URL" };
  }
  const rel = webPath.replace(/^\//, "");
  const abs = path.join(ROOT, "public", rel);
  if (!existsSync(abs)) {
    return { webPath, abs, ok: false, reason: `missing file public/${rel}` };
  }
  return { webPath, abs, ok: true, reason: null };
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
  return {
    _type: "image",
    asset: { _type: "reference", _ref: assetId },
  };
}

function fileField(assetId) {
  return {
    _type: "file",
    asset: { _type: "reference", _ref: assetId },
  };
}

function isSanityImageUrl(url) {
  return typeof url === "string" && /^https:\/\/cdn\.sanity\.io\/images\//.test(url);
}

function isSanityFileUrl(url) {
  return typeof url === "string" && /^https:\/\/cdn\.sanity\.io\/files\//.test(url);
}

function preflight(frames, boardIds) {
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(frames) || frames.length === 0) {
    errors.push("Hardcoded inProgressMedia is empty.");
    return errors;
  }
  for (const frame of frames) {
    const id = frame?.id;
    const label = id || "(missing-id)";
    if (!id) errors.push(`Frame ${label} cannot be migrated because stable ID is missing.`);
    if (id) {
      if (ids.has(id)) {
        errors.push(`Frame ${label} cannot be migrated because ID is duplicated.`);
      }
      ids.add(id);
    }
    if (!frame?.objectPosition || !String(frame.objectPosition).trim()) {
      errors.push(`Frame ${label} cannot be migrated because objectPosition is missing.`);
    }
    const still = publicFileFromWebPath(frame?.src);
    if (!still.ok) {
      errors.push(`Frame ${label} cannot be migrated because still ${still.reason}.`);
    }
    if (frame?.video) {
      const video = publicFileFromWebPath(frame.video);
      if (!video.ok) {
        errors.push(`Frame ${label} cannot be migrated because video ${video.reason}.`);
      }
    }
  }
  if (!Array.isArray(boardIds) || boardIds.length !== 4) {
    errors.push(
      `Composition cannot be migrated because it has ${boardIds?.length ?? 0} IDs, expected 4.`
    );
  } else if (new Set(boardIds).size !== 4) {
    errors.push("Composition cannot be migrated because panel IDs are not unique.");
  } else {
    for (const id of boardIds) {
      if (!ids.has(id)) {
        errors.push(
          `Composition cannot be migrated because panel ${id} is not in the full collection.`
        );
      }
    }
  }
  return errors;
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
  const filename = `dtm-in-progress-${path.basename(abs)}`;
  const asset = await client.assets.upload(
    kind,
    createReadStream(abs),
    kind === "file"
      ? { filename, contentType: "video/mp4" }
      : { filename }
  );
  cache.set(cacheKey, asset._id);
  stats[kind].uploaded += 1;
  return asset._id;
}

async function main() {
  console.log("[migrate-ip] DTM In-progress → Sanity development\n");

  if (process.argv.some((arg) => arg === "--dataset" || arg.startsWith("--dataset="))) {
    abort("This migration does not accept dataset overrides.");
  }

  loadEnvLocal();
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
  console.log(`[migrate-ip] Project: ${projectId || "(missing)"}`);
  console.log(`[migrate-ip] Dataset: ${configuredDataset || "(missing)"}`);
  if (!projectId) abort("NEXT_PUBLIC_SANITY_PROJECT_ID is missing.");
  assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", configuredDataset);
  console.log("[migrate-ip] Safety check passed\n");

  const source = await import(
    pathToFileURL(path.join(ROOT, "data/in-progress-scenes.ts")).href
  );
  const frames = source.inProgressMedia;
  const boardIds = [...source.inProgressCompositionIds];

  console.log(`[migrate-ip] Source frames: ${frames.length}`);
  frames.forEach((frame, index) => {
    console.log(
      `  ${index}. ${frame.id}${frame.video ? "  [video]" : ""}  ${frame.objectPosition}`
    );
  });
  console.log(`[migrate-ip] Composition: ${boardIds.join(" → ")}`);

  console.log("\n[migrate-ip] Preflight...");
  const preflightErrors = preflight(frames, boardIds);
  if (preflightErrors.length > 0) {
    preflightErrors.forEach((line) => console.error(`  FAIL  ${line}`));
    abort("Preflight failed. Zero mutations were sent.");
  }
  console.log("  PASS\n");

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
  if (client.config().projectId !== projectId) {
    abort("Write client project ID does not match NEXT_PUBLIC_SANITY_PROJECT_ID.");
  }

  const cache = new Map();
  const stats = {
    image: { uploaded: 0, reused: 0 },
    file: { uploaded: 0, reused: 0 },
  };
  const ranks = ranksForCount(frames.length);

  for (const [index, frame] of frames.entries()) {
    const id = documentId(frame.id);
    console.log(`[migrate-ip] ${index + 1}/${frames.length} ${frame.id} → ${id}`);
    const stillId = await uploadOrReuse(
      client,
      "image",
      publicFileFromWebPath(frame.src).abs,
      cache,
      stats
    );
    const doc = {
      _id: id,
      _type: "inProgressFrame",
      frameId: { _type: "slug", current: frame.id },
      still: imageField(stillId),
      objectPosition: frame.objectPosition,
      orderRank: ranks[index],
    };
    if (frame.video) {
      const videoId = await uploadOrReuse(
        client,
        "file",
        publicFileFromWebPath(frame.video).abs,
        cache,
        stats
      );
      doc.video = fileField(videoId);
    }
    await client.delete(`drafts.${id}`).catch(() => undefined);
    await client.createOrReplace(doc);
    console.log(`  orderRank=${ranks[index]}`);
  }

  const boardDoc = {
    _id: BOARD_ID,
    _type: "inProgressBoard",
    blinds: boardIds.map((frameId) => ({
      _type: "reference",
      _key: `blind-${frameId}`,
      _ref: documentId(frameId),
    })),
  };
  console.log(`[migrate-ip] Writing board ${BOARD_ID}`);
  await client.delete(`drafts.${BOARD_ID}`).catch(() => undefined);
  await client.createOrReplace(boardDoc);

  console.log(
    `\n[migrate-ip] Images uploaded=${stats.image.uploaded} reused=${stats.image.reused}`
  );
  console.log(
    `[migrate-ip] Videos uploaded=${stats.file.uploaded} reused=${stats.file.reused}`
  );

  const stored = await client.fetch(FRAMES_QUERY);
  const board = await client.fetch(BOARD_QUERY, { id: BOARD_ID });

  let failed = false;
  const storedIds = stored.map((row) => row.frameId);
  const sourceIds = frames.map((frame) => frame.id);
  if (stored.length !== frames.length) {
    console.error(`  FAIL  frame count ${stored.length} !== ${frames.length}`);
    failed = true;
  }
  if (JSON.stringify(storedIds) !== JSON.stringify(sourceIds)) {
    console.error(`  FAIL  order ${sourceIds.join(" → ")} vs ${storedIds.join(" → ")}`);
    failed = true;
  } else {
    console.log(`  PASS  order  ${storedIds.join(" → ")}`);
  }

  console.log("\n[migrate-ip] Source ↔ Sanity");
  for (const frame of frames) {
    const row = stored.find((item) => item.frameId === frame.id);
    const issues = [];
    if (!row) issues.push("missing document");
    else {
      if (row._id !== documentId(frame.id)) issues.push(`id ${row._id}`);
      if (!row.orderRank) issues.push("null orderRank");
      if ((row.objectPosition || "").trim() !== frame.objectPosition) {
        issues.push(`objectPosition ${row.objectPosition}`);
      }
      if (!isSanityImageUrl(row.src) || !String(row.stillAssetId || "").startsWith("image-")) {
        issues.push("still is not a Sanity image asset");
      }
      if (frame.video) {
        if (!isSanityFileUrl(row.video) || !String(row.videoAssetId || "").startsWith("file-")) {
          issues.push("video is not a Sanity file asset");
        }
      } else if (row.video) {
        issues.push("unexpected video");
      }
    }
    if (issues.length) {
      failed = true;
      console.error(`  FAIL  ${frame.id}  ${issues.join("; ")}`);
    } else {
      console.log(`  PASS  ${frame.id}`);
    }
  }

  const resolvedBoard = (board?.boardIds ?? []).filter(Boolean);
  if (resolvedBoard.length !== 4 || new Set(resolvedBoard).size !== 4) {
    failed = true;
    console.error(`  FAIL  board ${JSON.stringify(resolvedBoard)}`);
  } else if (JSON.stringify(resolvedBoard) !== JSON.stringify(boardIds)) {
    failed = true;
    console.error(
      `  FAIL  board ${resolvedBoard.join(" → ")} vs ${boardIds.join(" → ")}`
    );
  } else {
    console.log(`  PASS  board  ${resolvedBoard.join(" → ")}`);
  }

  if (failed) abort("Sanity read-back did not match source.");

  console.log("\n[migrate-ip] Frontend data layer (same GROQ as getInProgressContent)");
  console.log("  Sanity path: ACTIVE");
  console.log("  Hardcoded fallback: inactive");
  console.log(`  Frame count: ${stored.length}`);
  console.log(`  Ordered IDs: ${storedIds.join(" → ")}`);
  console.log(`  Board IDs: ${resolvedBoard.join(" → ")}`);
  for (const id of resolvedBoard) {
    const index = storedIds.indexOf(id);
    console.log(`  board frame ${id} → viewer index ${index}`);
  }

  console.log("\n[migrate-ip] Write dataset confirmed:", client.config().dataset);
  console.log("[migrate-ip] 0 mutations sent to production");
  console.log("[migrate-ip] Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
