/**
 * Inventory + normalize client Portfolio source under /new-materials/.
 * Writes manifest to tmp/ (gitignored). Does NOT mutate Sanity.
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { resolveNewMaterialsDir } from "./resolve-new-materials-dir.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolveNewMaterialsDir(ROOT);
const OUT = path.join(ROOT, "tmp", "real-portfolio-import");
const NORM = path.join(OUT, "normalized");
const MANIFEST = path.join(OUT, "manifest.json");

const PROJECT_FOLDERS = [
  "project_1",
  "project_2",
  "project_3",
  "project_4",
  "project_5",
  "project_6",
  "project_7",
];

function abort(message) {
  console.error(`\nABORT: ${message}\n`);
  process.exit(1);
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function extOf(name) {
  return path.extname(name).toLowerCase().replace(/^\./, "");
}

function findFfmpeg() {
  const which = spawnSync("where", ["ffmpeg"], { encoding: "utf8" });
  if (which.status === 0) {
    const line = which.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
    if (line) return line;
  }
  return "ffmpeg";
}

async function metaForImage(filePath) {
  try {
    const m = await sharp(filePath, { failOn: "none" }).metadata();
    return {
      width: m.width ?? null,
      height: m.height ?? null,
      format: m.format ?? null,
      orientation: m.orientation ?? null,
    };
  } catch {
    return { width: null, height: null, format: null, orientation: null };
  }
}

function convertHeic(ffmpegBin, src, dest) {
  mkdirSync(path.dirname(dest), { recursive: true });
  const result = spawnSync(
    ffmpegBin,
    [
      "-y",
      "-i",
      src,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      "-update",
      "1",
      dest,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0 || !existsSync(dest)) {
    abort(
      `HEIC convert failed for ${src}: ${result.stderr?.slice(-500) || result.stdout?.slice(-500) || "unknown"}`
    );
  }
}

async function main() {
  if (!existsSync(SOURCE)) abort(`Missing ${SOURCE}`);
  for (const folder of PROJECT_FOLDERS) {
    const dir = path.join(SOURCE, folder);
    if (!existsSync(dir)) abort(`Missing folder ${folder}`);
  }

  mkdirSync(NORM, { recursive: true });
  const ffmpegBin = findFfmpeg();
  const files = [];
  const hashIndex = new Map();

  for (const folder of PROJECT_FOLDERS) {
    const projectNumber = Number(folder.replace("project_", ""));
    const dir = path.join(SOURCE, folder);
    const names = readdirSync(dir).filter((n) => !n.startsWith("."));
    for (const name of names) {
      const full = path.join(dir, name);
      const st = statSync(full);
      if (!st.isFile()) continue;
      const ext = extOf(name);
      const hash = sha256File(full);
      const entry = {
        projectNumber,
        folder,
        originalFilename: name,
        relativePath: path.posix.join(folder, name),
        extension: ext,
        size: st.size,
        hash,
        width: null,
        height: null,
        normalizedPath: null,
        uploadPath: null,
        exactDuplicateOf: null,
        excludeFromGallery: false,
        notes: [],
      };

      if (hashIndex.has(hash)) {
        entry.exactDuplicateOf = hashIndex.get(hash);
        entry.excludeFromGallery = true;
        entry.notes.push("exact-byte-duplicate");
      } else {
        hashIndex.set(hash, entry.relativePath);
      }

      const isHeic = ext === "heic" || ext === "heif";
      if (isHeic) {
        const dest = path.join(NORM, folder, `${path.parse(name).name}.jpg`);
        if (!existsSync(dest)) convertHeic(ffmpegBin, full, dest);
        entry.normalizedPath = path.relative(ROOT, dest).replace(/\\/g, "/");
        entry.uploadPath = dest;
        entry.notes.push("heic→jpeg via ffmpeg");
        const meta = await metaForImage(dest);
        entry.width = meta.width;
        entry.height = meta.height;
      } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
        entry.uploadPath = full;
        const meta = await metaForImage(full);
        entry.width = meta.width;
        entry.height = meta.height;
      } else {
        entry.notes.push(`unsupported-or-other-format:${ext}`);
        entry.excludeFromGallery = true;
      }

      files.push(entry);
    }
  }

  const totals = {
    files: files.length,
    images: files.filter((f) =>
      ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(f.extension)
    ).length,
    videos: files.filter((f) =>
      ["mp4", "mov", "webm"].includes(f.extension)
    ).length,
    jpeg: files.filter((f) => ["jpg", "jpeg"].includes(f.extension)).length,
    png: files.filter((f) => f.extension === "png").length,
    heic: files.filter((f) => ["heic", "heif"].includes(f.extension)).length,
    webp: files.filter((f) => f.extension === "webp").length,
    other: files.filter(
      (f) =>
        !["jpg", "jpeg", "png", "webp", "heic", "heif", "mp4", "mov", "webm"].includes(
          f.extension
        )
    ).length,
    totalBytes: files.reduce((sum, f) => sum + f.size, 0),
    exactDuplicates: files.filter((f) => f.exactDuplicateOf).length,
  };

  const byProject = {};
  for (const folder of PROJECT_FOLDERS) {
    const n = Number(folder.replace("project_", ""));
    const group = files.filter((f) => f.projectNumber === n);
    const uniqueHashes = new Set(group.map((f) => f.hash));
    byProject[folder] = {
      projectNumber: n,
      totalSourceFiles: group.length,
      uniqueFiles: uniqueHashes.size,
      formats: [...new Set(group.map((f) => f.extension))],
      totalBytes: group.reduce((s, f) => s + f.size, 0),
      files: group.map((f) => f.originalFilename),
    };
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceRoot: "public/new-materials",
    mapping: PROJECT_FOLDERS.map((folder, i) => ({
      folder,
      projectNumber: i + 1,
    })),
    totals,
    byProject,
    files,
  };

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`[inventory] wrote ${path.relative(ROOT, MANIFEST)}`);
  console.log(JSON.stringify(totals, null, 2));
  for (const folder of PROJECT_FOLDERS) {
    const p = byProject[folder];
    console.log(
      `${folder}: files=${p.totalSourceFiles} unique=${p.uniqueFiles} formats=${p.formats.join(",")} size=${(p.totalBytes / 1024 / 1024).toFixed(2)}MiB`
    );
  }
}

await main();
