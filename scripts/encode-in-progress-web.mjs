/**
 * Deterministic In-progress web derivatives from public/in-progress/ originals.
 * Outputs to tmp/in-progress-import/ (gitignored).
 *
 * Preview (panel): 720×1280 H.264, no audio, faststart, ~2.5 Mbps cap
 * Viewer (full):   1080×1920 H.264 + AAC, faststart
 * Poster:          1080×1920 JPEG q85 from selected frame
 *
 * Usage: node scripts/encode-in-progress-web.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "public", "in-progress");
const OUT_ROOT = path.join(ROOT, "tmp", "in-progress-import");
const WEB_DIR = path.join(OUT_ROOT, "web");
const VIEWER_DIR = path.join(OUT_ROOT, "viewer");
const POSTER_DIR = path.join(OUT_ROOT, "selected");

const OBJECTS = [
  {
    frameId: "perfect-life-60",
    source: "ЖК Perfect Life 60 м.кв.MP4",
    posterPct: 20,
  },
  {
    frameId: "huge-lux-90",
    source: "ЖК Huge Lux 90 м.кв.MOV",
    posterPct: 20,
  },
  {
    frameId: "natsionalnyi-70",
    source: "ЖК Національний 70 м. кв.MOV",
    posterPct: 45,
  },
  {
    frameId: "ms-100",
    source: "ЖК MS 100 м.кв.MP4",
    posterPct: 20,
  },
];

function findFfmpeg() {
  const which = spawnSync("where", ["ffmpeg"], { encoding: "utf8", shell: true });
  if (which.status === 0 && which.stdout.trim()) {
    return which.stdout.trim().split(/\r?\n/)[0];
  }
  return "ffmpeg";
}

function run(bin, args, label) {
  const result = spawnSync(bin, args, { encoding: "utf8", shell: false });
  if (result.status !== 0) {
    console.error(`FAIL ${label}:\n${result.stderr}`);
    process.exit(1);
  }
}

function mb(bytes) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

const ffmpeg = findFfmpeg();
const ffprobe = ffmpeg.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1");

mkdirSync(WEB_DIR, { recursive: true });
mkdirSync(VIEWER_DIR, { recursive: true });
mkdirSync(POSTER_DIR, { recursive: true });

console.log("[encode-ip] ffmpeg:", ffmpeg);
console.log("[encode-ip] Source:", SOURCE_DIR);
console.log("[encode-ip] Output:", OUT_ROOT, "\n");

const report = [];

for (const obj of OBJECTS) {
  const input = path.join(SOURCE_DIR, obj.source);
  if (!existsSync(input)) {
    console.error(`ABORT: missing source ${input}`);
    process.exit(1);
  }

  const previewOut = path.join(WEB_DIR, `${obj.frameId}.mp4`);
  const viewerOut = path.join(VIEWER_DIR, `${obj.frameId}.mp4`);
  const posterOut = path.join(POSTER_DIR, `${obj.frameId}.jpg`);

  console.log(`--- ${obj.frameId} ---`);

  run(
    ffmpeg,
    [
      "-y",
      "-i",
      input,
      "-an",
      "-vf",
      "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2",
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "26",
      "-maxrate",
      "2500k",
      "-bufsize",
      "5000k",
      "-g",
      "60",
      "-movflags",
      "+faststart",
      previewOut,
    ],
    "preview"
  );

  run(
    ffmpeg,
    [
      "-y",
      "-i",
      input,
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "22",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      viewerOut,
    ],
    "viewer"
  );

  const durProbe = spawnSync(
    ffprobe,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      input,
    ],
    { encoding: "utf8" }
  );
  const duration = Number.parseFloat(durProbe.stdout.trim()) || 1;
  const seek = Math.max(0, duration * (obj.posterPct / 100));

  run(
    ffmpeg,
    [
      "-y",
      "-ss",
      String(seek),
      "-i",
      input,
      "-vframes",
      "1",
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
      "-q:v",
      "2",
      posterOut,
    ],
    "poster"
  );

  const before = statSync(input).size;
  const preview = statSync(previewOut).size;
  const viewer = statSync(viewerOut).size;
  const poster = statSync(posterOut).size;

  report.push({
    frameId: obj.frameId,
    sourceMB: (before / 1e6).toFixed(1),
    previewMB: (preview / 1e6).toFixed(1),
    viewerMB: (viewer / 1e6).toFixed(1),
    posterKB: Math.round(poster / 1024),
    reductionPct: Math.round((1 - preview / before) * 100),
  });

  console.log(
    `  preview ${mb(preview)} | viewer ${mb(viewer)} | poster ${Math.round(poster / 1024)} KB`
  );
}

console.log("\n[encode-ip] Summary:");
console.table(report);
console.log(
  "\n[encode-ip] Panel delivery uses web/*.mp4 (preview). Viewer uses viewer/*.mp4 when schema supports it."
);
console.log("[encode-ip] Re-import: npm run import:real-in-progress\n");
