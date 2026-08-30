import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const SECRET_PATTERNS = [
  { label: "telegram bot token shape", re: /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/ },
  { label: "resend api key shape", re: /\bre_[A-Za-z0-9]{20,}\b/ },
  { label: "sanity write token env assignment", re: /SANITY_(API_|AUTH_)?TOKEN\s*=\s*['"][^'"]+['"]/i },
  { label: "generic bearer secret", re: /Bearer\s+[A-Za-z0-9._-]{20,}/ },
];

const SCAN_ROOTS = [
  "app",
  "components",
  "lib",
  "data",
  "sanity",
  "public",
  "scripts",
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "backups",
  "test-results",
  "playwright-report",
]);

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (SKIP_DIRS.has(entry)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?|mjs|cjs|json|css|md)$/.test(entry)) files.push(full);
  }
  return files;
}

function scanFile(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel === ".env.example") return;
  const text = readFileSync(file, "utf8");
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.re.test(text)) {
      failures.push(`${rel}: possible ${pattern.label}`);
    }
  }
}

for (const root of SCAN_ROOTS) {
  for (const file of walk(path.join(ROOT, root))) scanFile(file);
}

const buildDir = path.join(ROOT, ".next", "static");
if (existsSync(buildDir)) {
  for (const file of walk(buildDir)) {
    if (!/\.js$/.test(file)) continue;
    scanFile(file);
  }
}

if (failures.length) {
  console.error("secret exposure checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("secret exposure checks passed");
