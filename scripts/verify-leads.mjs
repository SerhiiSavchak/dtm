import { parsePhoneNumberFromString } from "libphonenumber-js/min";

function parseArea(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  const compact = trimmed.replace(/\s+/g, "");
  if (/[eE]/.test(compact) || /[+-]/.test(compact)) return { ok: false, reason: "digits" };
  if (!/^\d+([.,]\d+)?$/.test(compact)) return { ok: false, reason: "digits" };
  const value = Number(compact.replace(",", "."));
  if (!Number.isFinite(value)) return { ok: false, reason: "digits" };
  if (value <= 0) return { ok: false, reason: "zero" };
  return { ok: true, value };
}

function normalizePhone(raw) {
  const parsed = parsePhoneNumberFromString(raw.trim(), "UA");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format("E.164");
}

const areaCases = [
  ["", "empty"],
  ["0", "zero"],
  ["-12", "digits"],
  ["abc", "digits"],
  ["1e2", "digits"],
  ["12.3.4", "digits"],
  ["  72  ", 72],
  ["72,5", 72.5],
  ["0072", 72],
  ["1 20", 120],
];

const phoneCases = [
  ["", null],
  ["0671234567", "+380671234567"],
  ["+380671234567", "+380671234567"],
  ["+380 67 123 45 67", "+380671234567"],
  ["(067) 123-45-67", "+380671234567"],
  ["123", null],
  ["+1234", null],
];

let failed = 0;
for (const [input, expected] of areaCases) {
  const result = parseArea(input);
  const actual = result.ok ? result.value : result.reason;
  if (actual !== expected) {
    failed += 1;
    console.error("area fail", JSON.stringify(input), actual, expected);
  }
}
for (const [input, expected] of phoneCases) {
  const actual = normalizePhone(input);
  if (actual !== expected) {
    failed += 1;
    console.error("phone fail", JSON.stringify(input), actual, expected);
  }
}

if (failed) {
  console.error(`Failed ${failed} cases`);
  process.exit(1);
}
console.log("lead field checks passed");
