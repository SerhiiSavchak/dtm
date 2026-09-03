/**
 * After a guarded development → production import, delete production documents
 * whose _id is not present in development. --replace cannot remove extras.
 *
 * SOURCE and TARGET are hardcoded and asserted. Never uses env dataset.
 */
import { createClient } from "@sanity/client";
import { getCliClient } from "sanity/cli";

const SOURCE = "development";
const TARGET = "production";

function abort(message) {
  console.error(`\nABORT: ${message}\nNo further Sanity mutations will be sent.\n`);
  process.exit(1);
}

if (SOURCE !== "development" || TARGET !== "production") {
  abort("hardcoded source/target drifted");
}

const cli = getCliClient({ apiVersion: "2025-08-22" });
const cfg = cli.config();
const token = cfg.token;
const projectId = cfg.projectId;
if (!token) abort("CLI client has no token");
if (!projectId) abort("CLI client has no projectId");

const sourceClient = createClient({
  projectId,
  dataset: SOURCE,
  apiVersion: "2025-08-22",
  token,
  useCdn: false,
  perspective: "raw",
});
const targetClient = createClient({
  projectId,
  dataset: TARGET,
  apiVersion: "2025-08-22",
  token,
  useCdn: false,
  perspective: "raw",
});

if (sourceClient.config().dataset !== SOURCE) abort("source client dataset mismatch");
if (targetClient.config().dataset !== TARGET) abort("target client dataset mismatch");

const REQUIRED_KEEP = [
  "dtm-real-project-sokilnyky",
  "dtm-real-project-novoznesenska",
  "dtm-real-project-kvity-lvova-3",
  "dtm-real-project-tiffany-2",
  "dtm-real-project-shengen-2",
  "dtm-real-project-tiffany-1",
  "dtm-real-project-chervonoyi-kalyny",
  "dtm-in-progress-perfect-life-60",
  "dtm-in-progress-huge-lux-90",
  "dtm-in-progress-natsionalnyi-70",
  "dtm-in-progress-ms-100",
  "inProgressBoard",
];

const sourceIds = new Set(
  (await sourceClient.fetch(`*._id`)).filter((id) => typeof id === "string")
);
const targetIds = (await targetClient.fetch(`*._id`)).filter(
  (id) => typeof id === "string"
);

for (const id of REQUIRED_KEEP) {
  if (!sourceIds.has(id)) abort(`development is missing required id ${id} — refusing prune`);
}

const extras = targetIds.filter((id) => !sourceIds.has(id));
console.log(`[prune] source=${SOURCE} keep=${sourceIds.size}`);
console.log(`[prune] target=${TARGET} current=${targetIds.length} extras=${extras.length}`);

if (extras.length === 0) {
  console.log("[prune] nothing to delete");
  process.exit(0);
}

for (const id of extras) {
  if (REQUIRED_KEEP.includes(id)) {
    abort(`refusing to delete required content id ${id}`);
  }
}

const BATCH = 50;
for (let i = 0; i < extras.length; i += BATCH) {
  const chunk = extras.slice(i, i + BATCH);
  let tx = targetClient.transaction();
  for (const id of chunk) tx = tx.delete(id);
  await tx.commit({ visibility: "async" });
  console.log(`[prune] deleted ${chunk.length}: ${chunk.join(", ")}`);
}

console.log(`[prune] removed ${extras.length} production-only document(s)`);
