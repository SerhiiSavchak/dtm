/**
 * Orchestrates authenticated Sanity CMS QA against development only.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sanityBin = path.join(ROOT, "node_modules", "sanity", "bin", "sanity");

function run(label, args, extraEnv = {}) {
  console.log(`\n======== ${label} ========`);
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit ${result.status}`);
  }
}

function sanityExec(extraEnv) {
  run("sanity exec qa-cms-development", [
    "--env-file=.env.local",
    sanityBin,
    "exec",
    "scripts/qa-cms-development.mjs",
    "--with-user-token",
  ], extraEnv);
}

try {
  try {
    sanityExec({ CMS_QA_DEFER_CLEANUP: "1", CMS_QA_PHASE: "mutate" });
    run("playwright cms-qa", [
      playwrightCli,
      "test",
      "e2e/cms-qa.spec.ts",
      "e2e/admin-auth.spec.ts",
    ], { DTM_CMS_QA: "1" });
  } finally {
    sanityExec({ CMS_QA_PHASE: "cleanup" });
  }
  console.log("\n[qa-cms] Runner finished: mutations, Playwright, cleanup.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
