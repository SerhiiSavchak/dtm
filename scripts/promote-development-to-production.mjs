/**
 * Guarded Sanity promotion: development → production.
 *
 * Requires explicit --source development --target production.
 * Imports a timestamped development export (--replace) then prunes
 * production-only leftover documents (test/QA/demo that --replace cannot delete).
 *
 * Abort if source/target are reversed, missing, or the archive is not a
 * development export.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sanityBin = path.join(ROOT, "node_modules", "sanity", "bin", "sanity");

function abort(message) {
  console.error(`\nABORT: ${message}\nNo further Sanity mutations will be sent.\n`);
  process.exit(1);
}

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((item) => item.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : "";
}

const source = arg("source");
const target = arg("target");
const archiveArg = arg("archive");

if (!source || !target) {
  abort('Required: --source=development --target=production --archive=backups/dtm-development-<stamp>.tar.gz');
}
if (source === target) abort("source and target must differ");
if (source !== "development" || target !== "production") {
  abort(
    `Refusing source=${JSON.stringify(source)} target=${JSON.stringify(target)}. Only development → production is allowed.`
  );
}
if (process.env.CONFIRM_DEVELOPMENT_TO_PRODUCTION !== "1") {
  abort('Set CONFIRM_DEVELOPMENT_TO_PRODUCTION=1 to authorize this production import.');
}

const archive = path.isAbsolute(archiveArg)
  ? archiveArg
  : path.join(ROOT, archiveArg);
if (!existsSync(archive)) abort(`archive missing: ${archive}`);
if (!/^dtm-development-.+\.tar\.gz$/.test(path.basename(archive))) {
  abort(`archive must be a development export named dtm-development-*.tar.gz, got ${path.basename(archive)}`);
}

console.log(`[promote] SOURCE=${source}`);
console.log(`[promote] TARGET=${target}`);
console.log(`[promote] ARCHIVE=${path.relative(ROOT, archive)}`);
console.log("[promote] method: sanity dataset import --replace (assets included in archive)");

const imported = spawnSync(
  process.execPath,
  [
    "--env-file=.env.local",
    sanityBin,
    "dataset",
    "import",
    archive,
    "--dataset",
    target,
    "--replace",
  ],
  { cwd: ROOT, stdio: "inherit" }
);

if (imported.status !== 0) {
  abort(`dataset import failed with exit ${imported.status}`);
}

console.log("[promote] import finished; pruning production-only leftovers");

const pruned = spawnSync(
  process.execPath,
  [
    "--env-file=.env.local",
    sanityBin,
    "exec",
    "scripts/prune-production-extras.mjs",
    "--with-user-token",
  ],
  { cwd: ROOT, stdio: "inherit" }
);

if (pruned.status !== 0) {
  abort(`production prune failed with exit ${pruned.status}`);
}

console.log("[promote] development → production complete");
