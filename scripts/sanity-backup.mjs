/**
 * Sanity dataset export with assets. Read-only. Default dataset: development.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKUPS = path.join(ROOT, "backups");
const sanityBin = path.join(ROOT, "node_modules", "sanity", "bin", "sanity");

function abort(message) {
  console.error(`\nABORT: ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const dataset = args[0] || "development";
if (!/^[a-z0-9_-]+$/i.test(dataset)) abort("Invalid dataset name.");

if (dataset !== "development") {
  if (process.env.ALLOW_NON_DEVELOPMENT_BACKUP !== "1") {
    abort(
      `Refusing dataset ${JSON.stringify(dataset)}. Default/safe target is "development". Set ALLOW_NON_DEVELOPMENT_BACKUP=1 only for an intentional read-only export of another dataset.`
    );
  }
  console.warn(
    `[sanity:backup] ALLOW_NON_DEVELOPMENT_BACKUP=1 — exporting ${dataset} (read-only; no mutations).`
  );
}

mkdirSync(BACKUPS, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(BACKUPS, `dtm-${dataset}-${stamp}.tar.gz`);
if (existsSync(dest)) abort(`Refusing to overwrite ${dest}`);

console.log(`[sanity:backup] dataset=${dataset}`);
console.log(`[sanity:backup] assets included (default export)`);
console.log(`[sanity:backup] output ${path.relative(ROOT, dest)}`);

const result = spawnSync(
  process.execPath,
  ["--env-file=.env.local", sanityBin, "dataset", "export", dataset, dest],
  { cwd: ROOT, stdio: "inherit" }
);

if (result.status !== 0) {
  abort(`Export failed with exit ${result.status}`);
}

console.log("[sanity:backup] done. Restore is manual — see docs/DTM-AUTONOMY-RUNBOOK.md");
