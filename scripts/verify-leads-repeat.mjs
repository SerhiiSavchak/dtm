import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canSubmitLead,
  createLeadSession,
  ensureLeadSession,
  restartLeadSession,
} from "../lib/leads/client-session.ts";
import { SubmissionIdempotency } from "../lib/leads/idempotency.ts";
import {
  deliverParsedLead,
} from "../lib/leads/process-lead.ts";
import { leadInputSchema } from "../lib/leads/schema.ts";
import { sendOwnerTelegram } from "../lib/leads/telegram.ts";
import { toCanonicalLead } from "../lib/leads/format.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function validInput(overrides = {}) {
  return leadInputSchema.parse({
    objectType: "apartment",
    area: 72,
    rooms: 2,
    renovationType: "turnkey",
    design: "no",
    condition: "newbuild",
    start: "1-3",
    name: "DTM TEST",
    phone: "+380671234567",
    locale: "uk",
    submissionId: crypto.randomUUID(),
    formStartedAt: Date.now() - 12_000,
    sourcePage: "/",
    ...overrides,
  });
}

function mockSenders() {
  const telegramIds = [];
  return {
    telegramIds,
    senders: {
      sendTelegram: async () => {
        const messageId = 4000 + telegramIds.length;
        telegramIds.push(messageId);
        return { ok: true, messageId };
      },
      sendEmail: async () => ({ ok: false, reason: "unconfigured" }),
    },
  };
}

async function testIntentionalRepeat() {
  const cache = new SubmissionIdempotency(10 * 60 * 1000);
  const { telegramIds, senders } = mockSenders();
  const idA = crypto.randomUUID();
  const idB = crypto.randomUUID();
  const a = await deliverParsedLead(validInput({ submissionId: idA, name: "DTM TEST A" }), cache, senders);
  const b = await deliverParsedLead(validInput({ submissionId: idB, name: "DTM TEST B" }), cache, senders);
  assertEqual("repeat A status", a.status, 200);
  assertEqual("repeat B status", b.status, 200);
  assertEqual("repeat telegram count", telegramIds.length, 2);
  assert("repeat ids differ", a.body.ok && b.body.ok && a.body.leadId !== b.body.leadId);
  assert("repeat A not duplicate", a.body.ok && !a.body.duplicate);
  assert("repeat B not duplicate", b.body.ok && !b.body.duplicate);
}

async function testAccidentalDuplicate() {
  const cache = new SubmissionIdempotency(10 * 60 * 1000);
  const { telegramIds, senders } = mockSenders();
  const id = crypto.randomUUID();
  const first = await deliverParsedLead(validInput({ submissionId: id }), cache, senders);
  const second = await deliverParsedLead(validInput({ submissionId: id }), cache, senders);
  assertEqual("dup first status", first.status, 200);
  assertEqual("dup second status", second.status, 200);
  assertEqual("dup telegram once", telegramIds.length, 1);
  assert("dup second marked", second.body.ok && second.body.duplicate === true);
  assert("dup same leadId", first.body.ok && second.body.ok && first.body.leadId === second.body.leadId);
}

async function testInflightCoalesce() {
  const cache = new SubmissionIdempotency(10 * 60 * 1000);
  let started = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const senders = {
    sendTelegram: async () => {
      started += 1;
      await gate;
      return { ok: true, messageId: 77 };
    },
    sendEmail: async () => ({ ok: false, reason: "unconfigured" }),
  };
  const id = crypto.randomUUID();
  const input = validInput({ submissionId: id });
  const p1 = deliverParsedLead(input, cache, senders);
  const p2 = deliverParsedLead(input, cache, senders);
  await new Promise((r) => setTimeout(r, 20));
  release();
  const [a, b] = await Promise.all([p1, p2]);
  assertEqual("coalesce telegram once", started, 1);
  assertEqual("coalesce A 200", a.status, 200);
  assertEqual("coalesce B 200", b.status, 200);
  assert("coalesce B duplicate", b.body.ok && b.body.duplicate === true);
}

async function testRetryAfterFailedSend() {
  const cache = new SubmissionIdempotency(10 * 60 * 1000);
  let calls = 0;
  const senders = {
    sendTelegram: async () => {
      calls += 1;
      if (calls === 1) return { ok: false, reason: "timeout" };
      return { ok: true, messageId: 88 };
    },
    sendEmail: async () => ({ ok: false, reason: "unconfigured" }),
  };
  const id = crypto.randomUUID();
  const first = await deliverParsedLead(validInput({ submissionId: id }), cache, senders);
  const second = await deliverParsedLead(validInput({ submissionId: id }), cache, senders);
  assertEqual("fail first status", first.status, 503);
  assertEqual("fail retry status", second.status, 200);
  assertEqual("fail then retry telegram calls", calls, 2);
  assert("fail retry not duplicate", second.body.ok && !second.body.duplicate);
}

async function testNoDuplicateAfterConfirmedSend() {
  const cache = new SubmissionIdempotency(10 * 60 * 1000);
  let calls = 0;
  const senders = {
    sendTelegram: async () => {
      calls += 1;
      return { ok: true, messageId: 91 };
    },
    sendEmail: async () => ({ ok: false, reason: "unconfigured" }),
  };
  const id = crypto.randomUUID();
  await deliverParsedLead(validInput({ submissionId: id }), cache, senders);
  const retry = await deliverParsedLead(validInput({ submissionId: id }), cache, senders);
  assertEqual("confirmed retry telegram once", calls, 1);
  assert("confirmed retry duplicate", retry.body.ok && retry.body.duplicate === true);
}

function testSessionLifecycle() {
  const a = createLeadSession(1000);
  const reused = ensureLeadSession(a, 2000);
  assertEqual("ensure reuses id", reused.submissionId, a.submissionId);
  assertEqual("ensure reuses startedAt", reused.formStartedAt, 1000);

  const created = ensureLeadSession(null, 3000);
  assert("ensure creates id", typeof created.submissionId === "string" && created.submissionId.length > 10);
  assertEqual("ensure creates startedAt", created.formStartedAt, 3000);

  const guards = {
    submitLock: true,
    hasSubmitted: true,
    navLock: false,
    phase: "success",
  };
  assert("blocked after success", canSubmitLead(guards) === false);

  const restarted = restartLeadSession(4000);
  assert("restart new id", restarted.session.submissionId !== a.submissionId);
  assertEqual("restart startedAt", restarted.session.formStartedAt, 4000);
  assertEqual("restart submitLock", restarted.submitLock, false);
  assertEqual("restart hasSubmitted", restarted.hasSubmitted, false);
  assertEqual("restart navLock", restarted.navLock, false);
  assert(
    "allowed after restart",
    canSubmitLead({
      ...restarted,
      phase: "form",
    }) === true
  );

  const retrySame = ensureLeadSession(a, 9000);
  assertEqual("retry same session id", retrySame.submissionId, a.submissionId);
}

function testSourceGuards() {
  const calc = readFileSync(join(root, "components/calculator/estimate-calculator.tsx"), "utf8");
  const route = readFileSync(join(root, "app/api/leads/route.ts"), "utf8");
  const telegram = readFileSync(join(root, "lib/leads/telegram.ts"), "utf8");

  assert("no useRef(crypto.randomUUID())", !calc.includes("useRef(crypto.randomUUID())"));
  assert("no useRef(createLeadSession())", !calc.includes("useRef(createLeadSession())"));
  assert("hasSubmittedRef exists", calc.includes("hasSubmittedRef"));
  assert("reset clears hasSubmitted", calc.includes("hasSubmittedRef.current = next.hasSubmitted"));
  assert("reset uses restartLeadSession", calc.includes("restartLeadSession()"));
  assert("submitLock released in finally", calc.includes("submitLockRef.current = false"));
  assert("abort on reset", calc.includes("abortRef.current?.abort()"));
  assert("return-home resets", calc.includes("onClick={() => onReset()}"));
  assert("client fetch no-store", calc.includes('cache: "no-store"'));
  assert("no window.open handoff", !calc.includes("window.open"));
  assert("no t.me draft url in calculator", !calc.includes("t.me/"));
  assert("no module alreadySent", !route.includes("alreadySent =") && !route.includes("let alreadySent"));
  assert("idempotency class used", route.includes("SubmissionIdempotency"));
  assert("telegram checks json.ok", telegram.includes("json?.ok") || telegram.includes("json.ok"));
  assert("telegram cache no-store", telegram.includes('cache: "no-store"'));
  assert("telegram 429 retry_after", telegram.includes("retry_after"));
}

async function testTelegramOkAnd429() {
  const prevToken = process.env.TELEGRAM_BOT_TOKEN;
  const prevChat = process.env.TELEGRAM_CHAT_ID;
  process.env.TELEGRAM_BOT_TOKEN = "123456:TESTTOKEN";
  process.env.TELEGRAM_CHAT_ID = "1";

  const lead = toCanonicalLead(validInput({ name: "DTM TEST" }));
  let calls = 0;
  const fetchOk = async () => {
    calls += 1;
    return new Response(JSON.stringify({ ok: true, result: { message_id: 501 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const ok = await sendOwnerTelegram(lead, { fetch: fetchOk });
  assert("telegram ok true", ok.ok === true && ok.messageId === 501);
  assertEqual("telegram ok one call", calls, 1);

  calls = 0;
  const fetchHttpOkJsonFalse = async () => {
    calls += 1;
    return new Response(JSON.stringify({ ok: false, description: "fail" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const rejected = await sendOwnerTelegram(lead, { fetch: fetchHttpOkJsonFalse });
  assert("telegram json.ok false rejected", rejected.ok === false);

  calls = 0;
  const fetch429thenOk = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify({ ok: false, parameters: { retry_after: 1 } }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, result: { message_id: 502 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  const after429 = await sendOwnerTelegram(lead, { fetch: fetch429thenOk });
  assert("telegram 429 then ok", after429.ok === true && after429.messageId === 502);
  assertEqual("telegram 429 retried once", calls, 2);

  calls = 0;
  const fetch429forever = async () => {
    calls += 1;
    return new Response(JSON.stringify({ ok: false, parameters: { retry_after: 1 } }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  };
  const still429 = await sendOwnerTelegram(lead, { fetch: fetch429forever });
  assert("telegram 429 not infinite", still429.ok === false);
  assertEqual("telegram 429 at most two calls", calls, 2);

  if (prevToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
  else process.env.TELEGRAM_BOT_TOKEN = prevToken;
  if (prevChat === undefined) delete process.env.TELEGRAM_CHAT_ID;
  else process.env.TELEGRAM_CHAT_ID = prevChat;
}

const tests = [
  ["intentional repeat", testIntentionalRepeat],
  ["accidental duplicate", testAccidentalDuplicate],
  ["inflight coalesce", testInflightCoalesce],
  ["retry after failed send", testRetryAfterFailedSend],
  ["no duplicate after confirmed send", testNoDuplicateAfterConfirmedSend],
  ["session lifecycle", async () => testSessionLifecycle()],
  ["source guards", async () => testSourceGuards()],
  ["telegram ok and 429", testTelegramOkAnd429],
];

for (const [name, fn] of tests) {
  const before = failures.length;
  await fn();
  if (failures.length === before) console.log(`ok  ${name}`);
  else console.log(`FAIL  ${name}`);
}

if (failures.length) {
  console.error(`\nFailed ${failures.length} checks:`);
  for (const item of failures) console.error(" -", item);
  process.exit(1);
}

console.log("lead repeat checks passed");
