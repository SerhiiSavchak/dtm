import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dictionaries } from "../lib/i18n/dictionaries.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

const uk = dictionaries.uk;
const en = dictionaries.en;

assert("UA FAQ count is 5", uk.faq.items.length === 5);
assert("EN FAQ count is 5", en.faq.items.length === 5);
assert(
  "removed FAQ question absent",
  !uk.faq.items.some((item) => item.q.includes("новобудов"))
);
assert(
  "EN removed FAQ question absent",
  !en.faq.items.some((item) => item.q.toLowerCase().includes("new builds"))
);
assert(
  "UA control FAQ uses виконроб",
  uk.faq.items.some((item) => item.a.includes("виконроб на об’єкті"))
);
assert("UA services item 4 title", uk.services.items[3]?.title === "Проєкт, виготовлення та монтаж меблів");
assert("UA services item 5 title", uk.services.items[4]?.title === "Дизайн інтер’єру");
assert("UA services count is 5", uk.services.items.length === 5);
assert("EN services count is 5", en.services.items.length === 5);
assert(
  "UA process step 4 text",
  uk.process.stages[3]?.text.includes("Плануємо етапи")
);
assert(
  "UA process step 6 cleaning",
  uk.process.stages[5]?.text.startsWith("Виконуємо післяремонтний клінінг")
);
assert(
  "UA intro responsibility uses виконроб",
  uk.intro.responsibilities.some((item) => item.title.includes("виконроб"))
);

const publicRoots = ["app", "components", "lib/i18n"];
const skipDirs = new Set(["node_modules", ".next", "backups", "data/generated"]);
const publicFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(ROOT, full);
    if (skipDirs.has(entry)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?|css|mdx?)$/.test(entry)) publicFiles.push(full);
  }
}

for (const root of publicRoots) walk(path.join(ROOT, root));

const prorabHits = [];
for (const file of publicFiles) {
  const text = readFileSync(file, "utf8");
  if (/прораб/i.test(text)) prorabHits.push(path.relative(ROOT, file));
}

assert("no public прораб occurrences", prorabHits.length === 0);

if (failures.length) {
  console.error("global copy checks failed:\n- " + failures.join("\n- "));
  if (prorabHits.length) {
    console.error("прораб hits:\n- " + prorabHits.join("\n- "));
  }
  process.exit(1);
}

console.log("global copy checks passed");
