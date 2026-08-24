import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCliClient } from "sanity/cli";

export const WRITE_DATASET = "development";
export const QA_PROJECT_ID = "dtm-qa-project";
export const QA_FRAME_ID = "dtm-qa-in-progress";
export const QA_PROJECT_SLUG = "qa-testova-kvartyra";
export const QA_FRAME_SLUG = "qa-in-progress-frame";
export const BOARD_ID = "inProgressBoard";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BASELINE_PATH = path.join(ROOT, "tmp", "cms-qa-baseline.json");
export const STATE_PATH = path.join(ROOT, "tmp", "cms-qa-state.json");
export const REPORT_PATH = path.join(ROOT, "tmp", "cms-qa-report.json");

export function abort(message) {
  console.error(`\nABORT: ${message}\nNo further Sanity mutations will be sent.\n`);
  process.exit(1);
}

export function loadEnvLocal() {
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

export function assertDevelopment(label, dataset) {
  if (dataset !== WRITE_DATASET) {
    abort(
      `${label} is ${JSON.stringify(dataset)}, expected exactly "${WRITE_DATASET}". Production writes are forbidden.`
    );
  }
}

export function refuseDatasetFlags() {
  if (process.argv.some((arg) => arg === "--dataset" || arg.startsWith("--dataset="))) {
    abort("CMS QA does not accept dataset overrides.");
  }
}

export async function createQaWriteClient() {
  refuseDatasetFlags();
  loadEnvLocal();

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
  if (!projectId) abort("NEXT_PUBLIC_SANITY_PROJECT_ID is missing.");
  assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", configuredDataset);

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

  return { client, projectId, token };
}
