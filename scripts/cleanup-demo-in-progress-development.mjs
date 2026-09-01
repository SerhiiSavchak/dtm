/**
 * After real In-progress import: delete legacy demo inProgressFrame docs from
 * development only. Keeps the four real frame IDs and the board.
 */
import { getCliClient } from "sanity/cli";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WRITE_DATASET = "development";
const KEEP = new Set([
  "perfect-life-60",
  "huge-lux-90",
  "natsionalnyi-70",
  "ms-100",
]);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

async function main() {
  loadEnvLocal();
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
  assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", configuredDataset);
  if (!projectId) abort("missing project id");

  const cliClient = getCliClient({ apiVersion: "2025-08-22" });
  const token = process.env.SANITY_AUTH_TOKEN || cliClient.config().token;
  if (!token) abort("No Sanity auth token");

  const client = cliClient.withConfig({
    projectId,
    dataset: WRITE_DATASET,
    apiVersion: "2025-08-22",
    useCdn: false,
    token,
    perspective: "raw",
  });
  assertDevelopment("write client", client.config().dataset);

  const board = await client.fetch(
    `*[_id == "inProgressBoard" && !(_id in path("drafts.**"))][0]{
      "boardIds": blinds[]->frameId.current
    }`
  );
  const boardIds = board?.boardIds ?? [];
  if (
    boardIds.length !== 4 ||
    !boardIds.every((id) => KEEP.has(id)) ||
    new Set(boardIds).size !== 4
  ) {
    abort(
      `Board is not the four real objects yet: ${JSON.stringify(boardIds)}. Aborting cleanup.`
    );
  }

  const frames = await client.fetch(
    `*[_type == "inProgressFrame" && !(_id in path("drafts.**"))]{
      _id, "frameId": frameId.current, mediaType, "video": video.asset->url
    }`
  );

  const realOk = KEEP.size === 4 && [...KEEP].every((id) =>
    frames.some(
      (f) =>
        f.frameId === id &&
        f.mediaType === "video" &&
        /^https:\/\/cdn\.sanity\.io\/files\//.test(f.video || "")
    )
  );
  if (!realOk) abort("Real four videos not fully present — abort cleanup.");

  const toDelete = frames.filter((f) => !KEEP.has(f.frameId));
  console.log(`[cleanup-demo-ip] Keep: ${[...KEEP].join(", ")}`);
  console.log(`[cleanup-demo-ip] Delete ${toDelete.length} demo frames:`);
  for (const row of toDelete) {
    console.log(`  - ${row._id} (${row.frameId})`);
  }

  for (const row of toDelete) {
    await client.delete(row._id);
    await client.delete(`drafts.${row._id}`).catch(() => undefined);
  }

  const remaining = await client.fetch(
    `count(*[_type == "inProgressFrame" && !(_id in path("drafts.**"))])`
  );
  if (remaining !== 4) {
    abort(`Expected 4 frames remaining, got ${remaining}`);
  }

  console.log("[cleanup-demo-ip] Remaining frames: 4");
  console.log("[cleanup-demo-ip] Write dataset:", client.config().dataset);
  console.log("[cleanup-demo-ip] 0 production mutations");
  console.log("[cleanup-demo-ip] Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
