/**
 * Read-only backup integrity check. Does NOT import or --replace.
 * Compares archive document IDs against live development GROQ.
 */
import { createClient } from "next-sanity";
import {
  createReadStream,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { extract } from "tar";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKUPS = path.join(ROOT, "backups");

function hydrateEnv() {
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

function abort(message) {
  console.error(`\nABORT: ${message}\n`);
  process.exit(1);
}

function latestDevelopmentBackup() {
  if (!existsSync(BACKUPS)) abort("backups/ directory missing.");
  const files = readdirSync(BACKUPS)
    .filter((name) => /^dtm-development-.*\.tar\.gz$/.test(name))
    .map((name) => {
      const full = path.join(BACKUPS, name);
      return { name, full, mtime: statSync(full).mtimeMs, size: statSync(full).size };
    })
    .sort((a, b) => b.mtime - a.mtime);
  if (!files.length) abort("No dtm-development-*.tar.gz found in backups/.");
  return files[0];
}

hydrateEnv();

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
if (dataset !== "development") {
  abort(
    `NEXT_PUBLIC_SANITY_DATASET is ${JSON.stringify(dataset)}, expected exactly "development".`
  );
}
if (!projectId) abort("NEXT_PUBLIC_SANITY_PROJECT_ID is missing.");

const backupArg = process.argv[2];
const backup = backupArg
  ? {
      name: path.basename(backupArg),
      full: path.isAbsolute(backupArg) ? backupArg : path.join(ROOT, backupArg),
      size: 0,
      mtime: 0,
    }
  : latestDevelopmentBackup();

if (!existsSync(backup.full)) abort(`Backup not found: ${backup.full}`);
const st = statSync(backup.full);
backup.size = st.size;
backup.mtime = st.mtimeMs;
if (backup.size < 1024) abort(`Backup looks empty (${backup.size} bytes).`);
if (!backup.name.includes("development")) {
  abort(`Refusing to inspect non-development backup name: ${backup.name}`);
}

console.log(`[backup-verify] SOURCE/QA DATASET: development`);
console.log(`[backup-verify] archive: ${path.relative(ROOT, backup.full)}`);
console.log(`[backup-verify] size: ${backup.size} bytes (${(backup.size / 1024 / 1024).toFixed(2)} MiB)`);
console.log(`[backup-verify] mtime: ${new Date(backup.mtime).toISOString()}`);

const tmp = mkdtempSync(path.join(os.tmpdir(), "dtm-backup-"));
try {
  await extract({
    file: backup.full,
    cwd: tmp,
    gzip: true,
  });

  const entries = [];
  function walk(dir, prefix = "") {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      const info = statSync(full);
      if (info.isDirectory()) walk(full, rel);
      else entries.push({ rel, size: info.size });
    }
  }
  walk(tmp);

  const ndjson = entries.find((e) => e.rel.endsWith(".ndjson") || e.rel.endsWith("/data.ndjson"));
  if (!ndjson) abort("No .ndjson document stream in archive.");
  const imageFiles = entries.filter((e) => /(^|\/)images\//.test(e.rel));
  const fileAssets = entries.filter((e) => /(^|\/)files\//.test(e.rel));
  console.log(`[backup-verify] ndjson: ${ndjson.rel} (${ndjson.size} bytes)`);
  console.log(`[backup-verify] images/ files: ${imageFiles.length}`);
  console.log(`[backup-verify] files/ assets: ${fileAssets.length}`);
  if (imageFiles.length < 1) abort("Expected image assets in export.");
  if (fileAssets.length < 1) {
    console.warn("[backup-verify] WARN: no files/ assets (video may be missing)");
  }

  const docs = [];
  const rl = createInterface({
    input: createReadStream(path.join(tmp, ndjson.rel)),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    docs.push(JSON.parse(trimmed));
  }

  const projects = docs.filter(
    (d) => d._type === "project" && !String(d._id).startsWith("drafts.")
  );
  const frames = docs.filter(
    (d) => d._type === "inProgressFrame" && !String(d._id).startsWith("drafts.")
  );
  const boards = docs.filter(
    (d) =>
      (d._type === "inProgressBoard" || d._id === "inProgressBoard") &&
      !String(d._id).startsWith("drafts.")
  );
  const imageAssets = docs.filter((d) => d._type === "sanity.imageAsset");
  const fileAssetDocs = docs.filter((d) => d._type === "sanity.fileAsset");

  console.log(`[backup-verify] published projects in archive: ${projects.length}`);
  console.log(`[backup-verify] published frames in archive: ${frames.length}`);
  console.log(`[backup-verify] board docs in archive: ${boards.length}`);
  console.log(`[backup-verify] imageAsset docs: ${imageAssets.length}`);
  console.log(`[backup-verify] fileAsset docs: ${fileAssetDocs.length}`);

  if (projects.length < 1) abort("Archive has no published projects.");
  if (frames.length < 1) abort("Archive has no published frames.");
  if (boards.length !== 1) abort(`Expected exactly 1 board, found ${boards.length}.`);

  const board = boards[0];
  const blinds = board.blinds || [];
  if (blinds.length !== 4) abort(`Board blinds length ${blinds.length}, expected 4.`);

  const client = createClient({
    projectId,
    dataset: "development",
    apiVersion: "2025-08-22",
    useCdn: false,
    perspective: "published",
  });

  const liveProjects = await client.fetch(
    `*[_type == "project" && !(_id in path("drafts.**"))] | order(orderRank asc) { _id, "slug": slug.current }`
  );
  const liveFrames = await client.fetch(
    `*[_type == "inProgressFrame" && !(_id in path("drafts.**"))] | order(orderRank asc) { _id, "frameId": frameId.current }`
  );
  const liveBoard = await client.fetch(
    `*[_id == "inProgressBoard" && !(_id in path("drafts.**"))][0]{ _id, "refs": blinds[]._ref }`
  );

  const archiveProjectIds = new Set(projects.map((p) => p._id));
  const liveProjectIds = new Set(liveProjects.map((p) => p._id));
  const archiveFrameIds = new Set(frames.map((f) => f._id));
  const liveFrameIds = new Set(liveFrames.map((f) => f._id));

  const missingProjects = [...liveProjectIds].filter((id) => !archiveProjectIds.has(id));
  const extraProjects = [...archiveProjectIds].filter((id) => !liveProjectIds.has(id));
  const missingFrames = [...liveFrameIds].filter((id) => !archiveFrameIds.has(id));
  const extraFrames = [...archiveFrameIds].filter((id) => !liveFrameIds.has(id));

  if (missingProjects.length || extraProjects.length) {
    abort(
      `Project ID mismatch. missingFromArchive=${missingProjects.join(",") || "(none)"} extraInArchive=${extraProjects.join(",") || "(none)"}`
    );
  }
  if (missingFrames.length || extraFrames.length) {
    abort(
      `Frame ID mismatch. missingFromArchive=${missingFrames.join(",") || "(none)"} extraInArchive=${extraFrames.join(",") || "(none)"}`
    );
  }
  if (liveBoard?._id !== "inProgressBoard") abort("Live board missing.");

  console.log(`[backup-verify] live projects: ${liveProjects.length} — IDs match archive`);
  console.log(`[backup-verify] live frames: ${liveFrames.length} — IDs match archive`);

  const archiveRefs = blinds.map((b) => b._ref);
  const liveRefs = liveBoard.refs || [];
  if (JSON.stringify(archiveRefs) !== JSON.stringify(liveRefs)) {
    console.warn(
      `[backup-verify] WARN board ref order differs archive=${archiveRefs.join("→")} live=${liveRefs.join("→")}`
    );
    if (
      JSON.stringify([...archiveRefs].sort()) !==
      JSON.stringify([...liveRefs].sort())
    ) {
      abort("Board reference set mismatch.");
    }
  } else {
    console.log(`[backup-verify] board refs order match: ${liveRefs.join(" → ")}`);
  }
  console.log("[backup-verify] PASS (readable archive; IDs match live development; assets present)");
  console.log(
    "[backup-verify] NOT DESTRUCTIVELY PROVEN: no dataset import --replace was executed"
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
