/**
 * Patch titleUa + area onto the four real In-progress frames.
 * Development dataset only. Preserves media, frameId, board refs.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PATCHES = [
  {
    id: "dtm-in-progress-perfect-life-60",
    frameId: "perfect-life-60",
    titleUa: "ЖК Perfect Life",
    area: 60,
  },
  {
    id: "dtm-in-progress-huge-lux-90",
    frameId: "huge-lux-90",
    titleUa: "ЖК Huge Lux",
    area: 90,
  },
  {
    id: "dtm-in-progress-natsionalnyi-70",
    frameId: "natsionalnyi-70",
    titleUa: "ЖК Національний",
    area: 70,
  },
  {
    id: "dtm-in-progress-ms-100",
    frameId: "ms-100",
    titleUa: "ЖК MS",
    area: 100,
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

  for (const patch of PATCHES) {
    const before = await client.fetch(
      `*[_id == $id][0]{
        _id, "frameId": frameId.current, mediaType,
        "videoRef": video.asset._ref, "posterRef": poster.asset._ref,
        objectPosition, orderRank, titleUa, area
      }`,
      { id: patch.id }
    );
    if (!before?._id) abort(`Missing document ${patch.id}`);
    if (before.frameId !== patch.frameId) {
      abort(`frameId mismatch for ${patch.id}: ${before.frameId}`);
    }
    if (before.mediaType !== "video" || !before.videoRef) {
      abort(`${patch.id} is not a video frame — refusing to patch.`);
    }

    await client
      .patch(patch.id)
      .set({ titleUa: patch.titleUa, area: patch.area })
      .unset(["titleEn"])
      .commit();

    const after = await client.fetch(
      `*[_id == $id][0]{
        titleUa, area, "frameId": frameId.current,
        "videoRef": video.asset._ref, "posterRef": poster.asset._ref,
        objectPosition, orderRank
      }`,
      { id: patch.id }
    );

    if (after.titleUa !== patch.titleUa || after.area !== patch.area) {
      abort(`Patch verify failed for ${patch.id}`);
    }
    if (
      after.videoRef !== before.videoRef ||
      after.posterRef !== before.posterRef ||
      after.objectPosition !== before.objectPosition ||
      after.orderRank !== before.orderRank ||
      after.frameId !== before.frameId
    ) {
      abort(`Identity drift after patch on ${patch.id}`);
    }

    console.log(`PASS  ${patch.frameId} → ${after.titleUa} · ${after.area} м²`);
  }

  const board = await client.fetch(
    `*[_id == "inProgressBoard"][0]{ "ids": blinds[]->frameId.current }`
  );
  const expected = PATCHES.map((p) => p.frameId);
  if (JSON.stringify(board?.ids) !== JSON.stringify(expected)) {
    abort(`Board order changed unexpectedly: ${JSON.stringify(board?.ids)}`);
  }
  console.log(`PASS  board ${board.ids.join(" → ")}`);
  console.log("[patch-ip-meta] write dataset:", client.config().dataset);
  console.log("[patch-ip-meta] 0 production mutations");
  console.log("[patch-ip-meta] Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
