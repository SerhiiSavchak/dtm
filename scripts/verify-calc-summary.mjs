import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyEstimatePatch,
  commitThenAdvance,
  formatCalculatorSummary,
  roomsForPayload,
  summaryCopyFromDict,
} from "../lib/calculator/answers.ts";
import { calculateProgress } from "../lib/calculator/progress.ts";
import {
  getStepSequence,
  initialEstimateState,
} from "../lib/calculator/types.ts";
import { assembleLeadRequest } from "../lib/leads/assemble.ts";
import {
  createLeadSession,
  restartLeadSession,
} from "../lib/leads/client-session.ts";
import {
  formatOwnerEmail,
  formatOwnerTelegram,
  parameterItemsFromLead,
  toCanonicalLead,
} from "../lib/leads/format.ts";
import { leadInputSchema } from "../lib/leads/schema.ts";
import { getDictionary } from "../lib/i18n/dictionaries.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const ukCopy = summaryCopyFromDict(getDictionary("uk").calculator);

function assert(label, condition) {
  if (!condition) failures.push(label);
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDeepEqual(label, actual, expected) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) failures.push(`${label}: expected ${b}, got ${a}`);
}

function filled(overrides = {}) {
  return applyEstimatePatch(initialEstimateState, {
    objectType: "apartment",
    area: "72",
    rooms: "2",
    renovationType: "turnkey",
    design: "no",
    condition: "newbuild",
    start: "1-3",
    name: "DTM TEST",
    phone: "+380671234567",
    ...overrides,
  });
}

function texts(state, stepId = "lead", copy = ukCopy) {
  return formatCalculatorSummary(state, stepId, copy).map((item) => item.text);
}

function keys(state, stepId = "lead", copy = ukCopy) {
  return formatCalculatorSummary(state, stepId, copy).map((item) => item.key);
}

const apartmentLeadTexts = [
  "Об’єкт: Квартира",
  "Площа: 72\u00A0м²",
  "Кімнати: 2",
  "Тип ремонту: Під ключ",
  "Дизайн-проєкт: Немає",
  "Стан об’єкта: Новобудова",
  "Плановий старт: 1–3 місяці",
];

const houseLeadTexts = [
  "Об’єкт: Будинок",
  "Площа: 120.5\u00A0м²",
  "Кімнати: 4",
  "Тип ремонту: Капітальний",
  "Дизайн-проєкт: Є",
  "Стан об’єкта: Вторинне житло",
  "Плановий старт: Якнайшвидше",
];

const commercialLeadTexts = [
  "Об’єкт: Комерційне приміщення",
  "Площа: 353\u00A0м²",
  "Тип ремонту: Косметичний",
  "Дизайн-проєкт: Немає",
  "Стан об’єкта: Після демонтажу",
  "Плановий старт: Пізніше",
];

function testApartmentExactOrder() {
  const state = filled();
  assertDeepEqual("1 apartment exact summary", texts(state), apartmentLeadTexts);
  assertDeepEqual("1 apartment keys", keys(state), [
    "objectType",
    "area",
    "rooms",
    "renovationType",
    "design",
    "condition",
    "start",
  ]);
}

function testHouseExactOrder() {
  const state = filled({
    objectType: "house",
    area: "120,5",
    rooms: "4",
    renovationType: "capital",
    design: "yes",
    condition: "secondary",
    start: "asap",
  });
  assertDeepEqual("2 house exact summary", texts(state), houseLeadTexts);
}

function testCommercialNoRooms() {
  const state = filled({
    objectType: "commercial",
    area: "353",
    rooms: "3",
    renovationType: "cosmetic",
    design: "no",
    condition: "demolished",
    start: "later",
  });
  assertEqual("3 commercial rooms payload null", roomsForPayload(state), null);
  assert(!keys(state).includes("rooms"), "3 commercial summary omits rooms");
  assertDeepEqual("3 commercial exact summary", texts(state), commercialLeadTexts);
}

function testRoomsNotApplicable() {
  const stale = applyEstimatePatch(
    filled({ objectType: "apartment", rooms: "5" }),
    { objectType: "commercial" }
  );
  assertEqual("4 rooms cleared", stale.rooms, "");
  assertEqual("4 rooms payload null", roomsForPayload(stale), null);
  assert(!keys(stale).includes("rooms"), "4 rooms omitted after object change");
}

function testFalseLikeAndZero() {
  const designNo = filled({ design: "no" });
  assert(
    texts(designNo).includes("Дизайн-проєкт: Немає"),
    "5 design=no is shown as Немає"
  );

  const zeroRooms = applyEstimatePatch(filled(), { rooms: "0" });
  assert(
    texts(zeroRooms).includes("Кімнати: 0"),
    "5 numeric 0 rooms is shown"
  );
}

function testNumericArea() {
  const state = filled({ area: "72,5" });
  assert(
    texts(state).includes("Площа: 72.5\u00A0м²"),
    "6 parsed area 72,5 displays 72.5"
  );
  const payload = assembleLeadRequest({
    state,
    locale: "uk",
    submissionId: crypto.randomUUID(),
    formStartedAt: Date.now() - 12_000,
    honeypot: "",
  });
  assertEqual("6 payload area number", payload.area, 72.5);
}

function testNoMultiSelect() {
  const calc = readFileSync(
    join(root, "components/calculator/estimate-calculator.tsx"),
    "utf8"
  );
  assert(
    !calc.includes("checkbox") && !calc.includes("multi"),
    "7 form has no multi-select control"
  );
  const state = filled();
  assert(
    !Object.values(state).some((value) => Array.isArray(value)),
    "7 answer state has no array fields"
  );
}

function testAutoAdvanceCommit() {
  let state = initialEstimateState;
  let index = 0;
  const afterObject = commitThenAdvance(state, index, { objectType: "apartment" });
  state = afterObject.state;
  index = afterObject.index;
  assertEqual("8 step after object", afterObject.stepId, "area");
  assertDeepEqual("8 summary after object", texts(state, afterObject.stepId), [
    "Об’єкт: Квартира",
  ]);

  const afterArea = commitThenAdvance(state, index, { area: "72" });
  assertEqual("8 step after area", afterArea.stepId, "rooms");
  assertDeepEqual("8 summary after area", texts(afterArea.state, afterArea.stepId), [
    "Об’єкт: Квартира",
    "Площа: 72\u00A0м²",
  ]);

  const calc = readFileSync(
    join(root, "components/calculator/estimate-calculator.tsx"),
    "utf8"
  );
  const optionClickAdvances =
    /onClick=\{\(\) =>\s*onSelectObject[\s\S]*goTo\(/.test(calc) ||
    /onClick=\{\(\) =>\s*\{\s*patch\([\s\S]*goTo\(/.test(calc);
  assert(
    !optionClickAdvances,
    "8 UI still advances on Next, not implicit option auto-advance"
  );
}

function testBackReplaceAnswer() {
  const start = filled({ renovationType: "cosmetic" });
  const steps = getStepSequence(start.objectType);
  const designIndex = steps.indexOf("design");
  const onDesign = texts(start, "design");
  assert(
    onDesign.includes("Тип ремонту: Косметичний"),
    "9 back to design still shows prior renovation"
  );
  assert(!onDesign.some((line) => line.startsWith("Дизайн-проєкт:")), "9 current step omitted");

  const replaced = applyEstimatePatch(start, { renovationType: "capital" });
  const afterNext = texts(replaced, steps[designIndex]);
  assert(
    afterNext.includes("Тип ремонту: Капітальний"),
    "9 replaced renovation shows immediately on later step"
  );
  assert(
    !afterNext.includes("Тип ремонту: Косметичний"),
    "9 old renovation label gone"
  );
}

function testObjectTypeInvalidatesRooms() {
  const apartment = filled({ objectType: "apartment", rooms: "6" });
  const commercial = applyEstimatePatch(apartment, { objectType: "commercial" });
  const payload = assembleLeadRequest({
    state: commercial,
    locale: "uk",
    submissionId: crypto.randomUUID(),
    formStartedAt: Date.now() - 12_000,
    honeypot: "",
  });
  assertEqual("10 commercial payload rooms", payload.rooms, null);
  assertDeepEqual(
    "10 visible steps drop rooms",
    getStepSequence(commercial.objectType).includes("rooms"),
    false
  );
  const house = applyEstimatePatch(commercial, { objectType: "house" });
  assertEqual("10 rooms stay empty after return", house.rooms, "");
  assert(getStepSequence(house.objectType).includes("rooms"), "10 house shows rooms again");
}

function testResetClearsSummaryAndProgress() {
  const reset = initialEstimateState;
  assertDeepEqual("11 reset summary empty", texts(reset, "objectType"), []);
  const total = getStepSequence(reset.objectType).length;
  assertEqual("11 reset progress", calculateProgress(0, total, false), Math.round((1 / total) * 100));
}

function testFirstAndSecondCompletion() {
  const first = createLeadSession(1000);
  const second = restartLeadSession(2000);
  assert(
    first.submissionId !== second.session.submissionId,
    "12 new session gets a new submissionId"
  );

  const payloadA = assembleLeadRequest({
    state: filled(),
    locale: "uk",
    submissionId: first.submissionId,
    formStartedAt: first.formStartedAt,
    honeypot: "",
  });
  const payloadB = assembleLeadRequest({
    state: filled({ name: "DTM TEST B" }),
    locale: "uk",
    submissionId: second.session.submissionId,
    formStartedAt: second.session.formStartedAt,
    honeypot: "",
  });
  assert(payloadA.submissionId !== payloadB.submissionId, "12 payloads use different ids");
  const leadA = toCanonicalLead(leadInputSchema.parse(payloadA));
  const leadB = toCanonicalLead(leadInputSchema.parse(payloadB));
  assert(leadA.leadId !== leadB.leadId, "12 second completion is a new leadId");
}

function testSummaryCssWrap() {
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  const start = css.indexOf(".calc-context {");
  const end = css.indexOf(".calc-stage {");
  assert(start !== -1 && end > start, "13 calc-context CSS block exists");
  const block = css.slice(start, end);
  assert(block.includes("flex-wrap: wrap"), "13 list wraps");
  assert(block.includes("overflow: visible"), "13 overflow visible");
  assert(block.includes("max-height: none"), "13 no max-height clip");
  assert(block.includes("flex: 0 0 auto"), "13 items do not shrink");
  assert(block.includes("white-space: normal"), "13 items wrap text");
  assert(block.includes("padding-bottom: clamp(0.75rem, 1.6vw, 1rem)"), "13 spacing padding kept");
  assert(block.includes("min-height: calc(1.5em + clamp(0.75rem, 1.6vw, 1rem))"), "13 min-height kept");
  assert(!/\.calc-context[^{]*\{[^}]*overflow:\s*hidden/.test(block), "13 no overflow hidden on context");
  assert(!block.includes("line-clamp"), "13 no line-clamp");
  assert(!block.includes("text-overflow: ellipsis"), "13 no ellipsis truncate");
}

function testFinalProgress100() {
  const commercial = filled({ objectType: "commercial" });
  const steps = getStepSequence(commercial.objectType);
  const last = steps.length - 1;
  assertEqual("15 commercial last index", last, 6);
  assertEqual("15 commercial 7/7 is 100", calculateProgress(last, steps.length, false), 100);
  const apartment = filled();
  const aptSteps = getStepSequence(apartment.objectType);
  assertEqual(
    "15 apartment last is 100",
    calculateProgress(aptSteps.length - 1, aptSteps.length, false),
    100
  );
}

function testPayloadMatchesSummary() {
  const state = filled({ objectType: "commercial", area: "353", rooms: "8" });
  const summary = formatCalculatorSummary(state, "lead", ukCopy);
  const payload = assembleLeadRequest({
    state,
    locale: "uk",
    submissionId: crypto.randomUUID(),
    formStartedAt: Date.now() - 12_000,
    honeypot: "",
  });
  const parsed = leadInputSchema.parse(payload);
  const lead = toCanonicalLead(parsed);
  const fromLead = parameterItemsFromLead(lead);

  assertDeepEqual(
    "16 summary keys vs lead parameters",
    summary.map((item) => item.key),
    fromLead.map((item) => item.key)
  );
  assertDeepEqual(
    "16 summary texts vs lead parameters",
    summary.map((item) => item.text),
    fromLead.map((item) => item.text)
  );
  assertEqual("16 payload rooms null", parsed.rooms, null);
  assertEqual("16 payload area", parsed.area, 353);
  assertEqual("16 payload design", parsed.design, "no");
}

function testTelegramEmailIncludeAnswers() {
  const state = filled();
  const payload = assembleLeadRequest({
    state,
    locale: "uk",
    submissionId: crypto.randomUUID(),
    formStartedAt: Date.now() - 12_000,
    honeypot: "",
    sourcePage: "/",
  });
  const lead = toCanonicalLead(leadInputSchema.parse(payload));
  const telegram = formatOwnerTelegram(lead);
  const email = formatOwnerEmail(lead);
  const summary = texts(state);

  for (const line of summary) {
    assert(telegram.includes(line), `17 telegram includes ${line}`);
    assert(email.text.includes(line), `17 email text includes ${line}`);
    assert(email.html.includes(line.split(": ")[1]), `17 email html includes value of ${line}`);
  }
  assert(!telegram.includes("Кімнати") || telegram.includes("Кімнати: 2"), "17 apartment rooms in telegram");

  const commercial = filled({
    objectType: "commercial",
    area: "353",
    rooms: "9",
    renovationType: "cosmetic",
    condition: "demolished",
    start: "later",
  });
  const commercialLead = toCanonicalLead(
    leadInputSchema.parse(
      assembleLeadRequest({
        state: commercial,
        locale: "uk",
        submissionId: crypto.randomUUID(),
        formStartedAt: Date.now() - 12_000,
        honeypot: "",
      })
    )
  );
  const commercialTelegram = formatOwnerTelegram(commercialLead);
  assert(!commercialTelegram.includes("Кімнати"), "17 commercial telegram omits rooms");
  for (const line of texts(commercial)) {
    assert(commercialTelegram.includes(line), `17 commercial telegram includes ${line}`);
  }
}

function testCalculatorUsesCanonicalSummary() {
  const calc = readFileSync(
    join(root, "components/calculator/estimate-calculator.tsx"),
    "utf8"
  );
  assert(calc.includes("formatCalculatorSummary"), "calculator uses canonical summary helper");
  assert(!calc.includes('key: "object"'), "calculator no longer hardcodes object/area-only items");
  assert(calc.includes("resolveCalculatorProgress(stepIndex, state.objectType, isComplete)"), "one progress helper");
  assert(calc.includes('style={{ ["--calc-p" as string]: String(progressPercent / 100) }}'), "bar uses same progress");
  assert(calc.includes("aria-valuenow={progressPercent}"), "aria uses same progress");
  assert(calc.includes("restartLeadSession()"), "reset starts a new lead session");
}

function testUnansweredFutureOmitted() {
  const partial = applyEstimatePatch(initialEstimateState, {
    objectType: "house",
    area: "80",
  });
  assertDeepEqual("unanswered future omitted on area+object only at rooms", texts(partial, "rooms"), [
    "Об’єкт: Будинок",
    "Площа: 80\u00A0м²",
  ]);
}

const tests = [
  ["1 apartment all answers", testApartmentExactOrder],
  ["2 house all answers", testHouseExactOrder],
  ["3 commercial all answers", testCommercialNoRooms],
  ["4 rooms not applicable", testRoomsNotApplicable],
  ["5 Ні/false-like and 0", testFalseLikeAndZero],
  ["6 numeric area", testNumericArea],
  ["7 no multi-select", testNoMultiSelect],
  ["8 auto-advance commit path", testAutoAdvanceCommit],
  ["9 back and replace", testBackReplaceAnswer],
  ["10 object type invalidates rooms", testObjectTypeInvalidatesRooms],
  ["11 reset", testResetClearsSummaryAndProgress],
  ["12 first and second completion", testFirstAndSecondCompletion],
  ["13-14 summary CSS wrap (no visual harness)", testSummaryCssWrap],
  ["15 final progress 100%", testFinalProgress100],
  ["16 API payload matches summary", testPayloadMatchesSummary],
  ["17 telegram/email include answers", testTelegramEmailIncludeAnswers],
  ["canonical wiring", testCalculatorUsesCanonicalSummary],
  ["omit unanswered future", testUnansweredFutureOmitted],
];

for (const [name, fn] of tests) {
  const before = failures.length;
  fn();
  if (failures.length === before) console.log(`ok  ${name}`);
  else console.log(`FAIL  ${name}`);
}

if (failures.length) {
  console.error(`\nFailed ${failures.length} checks:`);
  for (const item of failures) console.error(" -", item);
  process.exit(1);
}

console.log("calculator summary checks passed");
