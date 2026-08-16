import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  calculateProgress,
  getVisibleSteps,
  resolveCalculatorProgress,
} from "../lib/calculator/progress.ts";
import { getStepSequence } from "../lib/calculator/types.ts";

const failures = [];
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assert(label, condition) {
  if (!condition) failures.push(label);
}

const src = readFileSync(join(root, "lib/calculator/progress.ts"), "utf8");
if (!src.includes("const currentStep = index + 1")) {
  failures.push("progress.ts must use 1-based currentStep");
}
if (!src.includes("Math.round((currentStep / totalSteps) * 100)")) {
  failures.push("progress.ts must use (currentStep / totalSteps) * 100");
}
if (src.includes("Math.round((index / totalSteps) * 100)")) {
  failures.push("progress.ts still uses 0-based index / totalSteps");
}
if (src.includes("Math.floor")) {
  failures.push("progress.ts must not use Math.floor");
}
if (!src.includes("if (isComplete) return 100")) {
  failures.push("progress.ts no longer returns 100 on complete");
}

const n7 = 7;
const walk7 = [0, 1, 0].map((index) => calculateProgress(index, n7, false));
assertEqual("open step1 N=7", walk7[0], 14);
assertEqual("next step2 N=7", walk7[1], 29);
assertEqual("back step1 N=7", walk7[2], 14);

const expected7 = [14, 29, 43, 57, 71, 86, 100];
for (let i = 0; i < n7; i++) {
  assertEqual(`N=7 index ${i}`, calculateProgress(i, n7, false), expected7[i]);
}
assertEqual("N=7 last form step", calculateProgress(6, n7, false), 100);
assertEqual("N=7 success", calculateProgress(6, n7, true), 100);

const n8 = 8;
const expected8 = [13, 25, 38, 50, 63, 75, 88, 100];
for (let i = 0; i < n8; i++) {
  assertEqual(`N=8 index ${i}`, calculateProgress(i, n8, false), expected8[i]);
}
assertEqual("N=8 last form step", calculateProgress(7, n8, false), 100);
assertEqual("N=8 success", calculateProgress(7, n8, true), 100);

assertEqual("validation does not advance", calculateProgress(0, 7, false), 14);
assertEqual("never below 0", calculateProgress(-4, 7, false), 14);
assertEqual("never above 100", calculateProgress(99, 7, false), 100);
assertEqual("empty sequence", calculateProgress(0, 0, false), 0);

assertEqual("base path is 7 steps", getStepSequence(null).length, 7);
assertEqual("apartment path is 8 steps", getStepSequence("apartment").length, 8);
assertEqual("house path is 8 steps", getStepSequence("house").length, 8);
assertEqual("commercial path is 7 steps", getStepSequence("commercial").length, 7);
assert(
  "apartment path includes rooms after commit",
  getStepSequence("apartment").includes("rooms")
);
assert(
  "commercial path has no rooms",
  !getStepSequence("commercial").includes("rooms")
);

const objectTypes = ["apartment", "house", "commercial"];
for (const type of objectTypes) {
  const selected = resolveCalculatorProgress(0, type, false);
  assertEqual(`${type} step1 currentStep`, selected.currentStep, 1);
  assertEqual(`${type} step1 totalSteps`, selected.totalSteps, 7);
  assertEqual(`${type} step1 percent`, selected.progressPercent, 14);
  assertEqual(
    `${type} step1 label formula`,
    Math.round((selected.currentStep / selected.totalSteps) * 100),
    selected.progressPercent
  );
  assert(
    `${type} selection does not add rooms yet`,
    !selected.steps.includes("rooms")
  );
}

const reselect = resolveCalculatorProgress(0, "house", false);
assertEqual("reselect house still 1", reselect.currentStep, 1);
assertEqual("reselect house still 7", reselect.totalSteps, 7);
assertEqual("reselect house still 14%", reselect.progressPercent, 14);

const afterApartment = resolveCalculatorProgress(1, "apartment", false);
assertEqual("apartment after next currentStep", afterApartment.currentStep, 2);
assertEqual("apartment after next totalSteps", afterApartment.totalSteps, 8);
assertEqual("apartment after next percent", afterApartment.progressPercent, 25);
assert(
  "apartment after next includes rooms",
  afterApartment.steps.includes("rooms")
);
assertEqual(
  "apartment after next bar matches text",
  Math.round((afterApartment.currentStep / afterApartment.totalSteps) * 100),
  afterApartment.progressPercent
);

const afterHouse = resolveCalculatorProgress(1, "house", false);
assertEqual("house after next totalSteps", afterHouse.totalSteps, 8);
assertEqual("house after next percent", afterHouse.progressPercent, 25);

const afterCommercial = resolveCalculatorProgress(1, "commercial", false);
assertEqual("commercial after next currentStep", afterCommercial.currentStep, 2);
assertEqual("commercial after next totalSteps", afterCommercial.totalSteps, 7);
assertEqual("commercial after next percent", afterCommercial.progressPercent, 29);
assert(
  "commercial after next has no rooms",
  !afterCommercial.steps.includes("rooms")
);

const backFromApartment = resolveCalculatorProgress(0, "apartment", false);
assertEqual("back currentStep", backFromApartment.currentStep, 1);
assertEqual("back totalSteps", backFromApartment.totalSteps, 7);
assertEqual("back percent", backFromApartment.progressPercent, 14);
assert(
  "back does not keep rooms in denominator",
  !backFromApartment.steps.includes("rooms")
);

const areaOnApartment = resolveCalculatorProgress(1, "apartment", false);
const roomsOnApartment = resolveCalculatorProgress(2, "apartment", false);
assertEqual("area on apartment percent", areaOnApartment.progressPercent, 25);
assertEqual("rooms on apartment percent", roomsOnApartment.progressPercent, 38);
assert(
  "back from rooms to area decreases",
  resolveCalculatorProgress(1, "apartment", false).progressPercent <
    roomsOnApartment.progressPercent
);

assertEqual(
  "visible steps on step 0 ignore live apartment sequence",
  getVisibleSteps("apartment", 0).length,
  7
);
assertEqual(
  "visible steps after next use apartment sequence",
  getVisibleSteps("apartment", 1).length,
  8
);

const calc = readFileSync(
  join(root, "components/calculator/estimate-calculator.tsx"),
  "utf8"
);
assert(
  calc.includes("resolveCalculatorProgress(stepIndex, state.objectType, isComplete)"),
  "calculator uses one progress resolver"
);
assert(
  calc.includes("{dict.stepOf} {currentStep} / {totalSteps}"),
  "step label uses resolver currentStep/totalSteps"
);
assert(
  calc.includes("{progressPercent}%"),
  "percent text uses resolver progressPercent"
);
assert(
  calc.includes("aria-valuenow={progressPercent}"),
  "aria uses same progressPercent"
);
assert(
  calc.includes('style={{ ["--calc-p" as string]: String(progressPercent / 100) }}'),
  "bar width uses same progressPercent"
);
assert(
  !calc.includes("getStepSequence(state.objectType)"),
  "live objectType must not drive the step list"
);
assert(
  !/setStepIndex[\s\S]{0,80}objectType|objectType[\s\S]{0,120}setStepIndex/.test(calc),
  "selecting objectType must not change stepIndex"
);
assert(
  !calc.includes("progressMobile") &&
    !calc.includes("mobileProgress") &&
    !calc.includes("calculateProgressMobile"),
  "no separate mobile progress formula"
);
assert(!calc.includes("selectedOptionIndex"), "progress is not selectedOptionIndex");
assert(!calc.includes("Math.floor"), "calculator must not floor progress");

const progressBlock = calc.slice(
  calc.indexOf("const isComplete"),
  calc.indexOf("function errorMessage")
);
assert(
  !progressBlock.includes("matchMedia"),
  "progress calculation is not split by viewport"
);

if (failures.length) {
  console.error("FAIL\n" + failures.join("\n"));
  process.exit(1);
}

console.log("14% → 29% → 14% (N=7):", walk7.join(" → "));
console.log("N=7 steps:", expected7.join(", "), "success 100");
console.log("N=8 steps:", expected8.join(", "), "success 100");
console.log(
  "select on step 1:",
  objectTypes
    .map((type) => {
      const p = resolveCalculatorProgress(0, type, false);
      return `${type} ${p.currentStep}/${p.totalSteps} ${p.progressPercent}%`;
    })
    .join(" | ")
);
console.log(
  "after next:",
  `apartment ${afterApartment.currentStep}/${afterApartment.totalSteps} ${afterApartment.progressPercent}%`,
  `| commercial ${afterCommercial.currentStep}/${afterCommercial.totalSteps} ${afterCommercial.progressPercent}%`
);
console.log("OK");
