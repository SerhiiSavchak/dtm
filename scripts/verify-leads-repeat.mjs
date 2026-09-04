import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canSubmitLead,
  createLeadSession,
  ensureLeadSession,
  isConfirmedLeadDelivery,
  restartLeadSession,
} from "../lib/leads/client-session.ts";
import { SubmissionIdempotency } from "../lib/leads/idempotency.ts";
import { maskPhone } from "../lib/leads/log.ts";
import { deliverParsedLead } from "../lib/leads/process-lead.ts";
import { leadInputSchema } from "../lib/leads/schema.ts";
import { sendOwnerEmail } from "../lib/leads/email.ts";
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

async function testEmailChannelMatrix() {
  async function run(telegramOk, emailResult) {
    const cache = new SubmissionIdempotency(10 * 60 * 1000);
    return deliverParsedLead(validInput(), cache, {
      sendTelegram: async () =>
        telegramOk ? { ok: true, messageId: 1 } : { ok: false, reason: "timeout" },
      sendEmail: async () => emailResult,
    });
  }

  const both = await run(true, { ok: true, messageId: "em-ok" });
  assertEqual("A status", both.status, 200);
  assert("A telegram", both.body.ok && both.body.delivered.telegram === true);
  assert("A email", both.body.ok && both.body.delivered.email === true);

  const unconfigured = await run(true, { ok: false, reason: "unconfigured", errorType: "unconfigured" });
  assertEqual("B status", unconfigured.status, 200);
  assert("B telegram", unconfigured.body.ok && unconfigured.body.delivered.telegram === true);
  assert("B email failed", unconfigured.body.ok && unconfigured.body.delivered.email === false);

  const rejected = await run(true, { ok: false, reason: "resend_error", errorType: "resend_error" });
  assertEqual("C status", rejected.status, 200);
  assert("C telegram", rejected.body.ok && rejected.body.delivered.telegram === true);
  assert("C email failed", rejected.body.ok && rejected.body.delivered.email === false);

  const telegramDown = await run(false, { ok: true, messageId: "em-ok" });
  assertEqual("D status", telegramDown.status, 200);
  assert("D telegram failed", telegramDown.body.ok && telegramDown.body.delivered.telegram === false);
  assert("D email sent", telegramDown.body.ok && telegramDown.body.delivered.email === true);

  const bothDown = await run(false, { ok: false, reason: "resend_error", errorType: "resend_error" });
  assertEqual("E status", bothDown.status, 503);
  assert("E failed", bothDown.body.ok === false);
}

async function testEmailSendControlledFailures() {
  const lead = toCanonicalLead(validInput());
  const prev = snapshotEnv([
    "RESEND_API_KEY",
    "LEADS_FROM_EMAIL",
    "LEAD_EMAIL_TO",
    "LEAD_EMAIL_COPY_TO",
  ]);

  delete process.env.RESEND_API_KEY;
  delete process.env.LEADS_FROM_EMAIL;
  delete process.env.LEAD_EMAIL_TO;
  delete process.env.LEAD_EMAIL_COPY_TO;
  const missing = await sendOwnerEmail(lead);
  assert("F unconfigured", missing.ok === false && missing.reason === "unconfigured");

  process.env.RESEND_API_KEY = "re_test_not_real";
  process.env.LEAD_EMAIL_TO = "not-an-email";
  process.env.LEADS_FROM_EMAIL = "also-bad";
  const invalid = await sendOwnerEmail(lead, { send: async () => ({ data: { id: "x" } }) });
  assert("F invalid_configuration", invalid.ok === false && invalid.reason === "invalid_configuration");

  process.env.LEAD_EMAIL_TO = "owner@example.com";
  process.env.LEADS_FROM_EMAIL = "DTM Website <onboarding@resend.dev>";

  const rejected = await sendOwnerEmail(lead, {
    send: async () => ({ data: null, error: { name: "validation_error", message: "denied" } }),
  });
  assert("C resend_error", rejected.ok === false && rejected.reason === "resend_error");

  const threw = await sendOwnerEmail(lead, {
    send: async () => {
      throw new Error("boom");
    },
  });
  assert("F throw unexpected", threw.ok === false && threw.reason === "unexpected_error");

  const network = await sendOwnerEmail(lead, {
    send: async () => {
      throw new TypeError("fetch failed");
    },
  });
  assert("F network", network.ok === false && network.reason === "network_error");

  const ok = await sendOwnerEmail(lead, {
    send: async () => ({ data: { id: "msg_1" }, error: null }),
  });
  assert("A send ok", ok.ok === true && ok.messageId === "msg_1");

  restoreEnv(prev);
}

function testPhoneMask() {
  assertEqual("mask last4", maskPhone("+380671234567"), "*******4567");
  assertEqual("mask short", maskPhone("12"), "****");
}

function testConfirmedDeliveryGuard() {
  assert(
    "email-only is success",
    isConfirmedLeadDelivery(true, {
      ok: true,
      leadId: "DTM-1111-2222",
      delivered: { telegram: false, email: true },
    }) === true
  );
  assert(
    "telegram success",
    isConfirmedLeadDelivery(true, {
      ok: true,
      leadId: "DTM-1111-2222",
      delivered: { telegram: true, email: false },
    }) === true
  );
  assert(
    "http error not success",
    isConfirmedLeadDelivery(false, {
      ok: true,
      leadId: "DTM-1111-2222",
      delivered: { telegram: true, email: true },
    }) === false
  );
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
  const email = readFileSync(join(root, "lib/leads/email.ts"), "utf8");
  const processLead = readFileSync(join(root, "lib/leads/process-lead.ts"), "utf8");

  assert("no useRef(crypto.randomUUID())", !calc.includes("useRef(crypto.randomUUID())"));
  assert("no useRef(createLeadSession())", !calc.includes("useRef(createLeadSession())"));
  assert("hasSubmittedRef exists", calc.includes("hasSubmittedRef"));
  assert("reset clears hasSubmitted", calc.includes("hasSubmittedRef.current = next.hasSubmitted"));
  assert("reset uses restartLeadSession", calc.includes("restartLeadSession()"));
  assert("success again copy button", calc.includes("dict.success.again"));
  assert("single success restart", !calc.includes("dict.success.newCalc"));
  assert("no return-home reset", !calc.includes('href="#top"'));
  assert("reset handler on success", calc.includes("onClick={onReset}"));
  assert("submitLock released in finally", calc.includes("submitLockRef.current = false"));
  assert("client requires confirmed delivery", calc.includes("isConfirmedLeadDelivery"));
  assert("abort on reset", calc.includes("abortRef.current?.abort()"));
  assert("client fetch no-store", calc.includes('cache: "no-store"'));
  assert("no window.open handoff", !calc.includes("window.open"));
  assert("no t.me draft url in calculator", !calc.includes("t.me/"));
  assert("no module alreadySent", !route.includes("alreadySent =") && !route.includes("let alreadySent"));
  assert("idempotency class used", route.includes("SubmissionIdempotency"));
  assert("telegram checks json.ok", telegram.includes("json?.ok") || telegram.includes("json.ok"));
  assert("telegram cache no-store", telegram.includes('cache: "no-store"'));
  assert("telegram 429 retry_after", telegram.includes("retry_after"));
  assert("telegram copy env", telegram.includes("TELEGRAM_COPY_CHAT_IDS"));
  assert("telegram primary env", telegram.includes("TELEGRAM_PRIMARY_CHAT_ID"));
  assert("telegram no legacy chat env", !telegram.includes("TELEGRAM_CHAT_ID"));
  assert("email copy env", email.includes("LEAD_EMAIL_COPY_TO"));
  assert("email primary env", email.includes("LEAD_EMAIL_TO"));
  assert("email no legacy to env", !email.includes("LEADS_TO_EMAIL"));
  assert("email no legacy copy env", !email.includes("LEADS_COPY_TO_EMAIL"));
  assert("copy fail does not fail lead logs", processLead.includes("telegram_copy_failed"));
}

function restoreEnv(prev) {
  for (const [key, value] of Object.entries(prev)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function snapshotEnv(keys) {
  const prev = {};
  for (const key of keys) prev[key] = process.env[key];
  return prev;
}

async function testTelegramCopyMatrix() {
  const prev = snapshotEnv([
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_PRIMARY_CHAT_ID",
    "TELEGRAM_COPY_CHAT_IDS",
    "TELEGRAM_MESSAGE_THREAD_ID",
  ]);
  process.env.TELEGRAM_BOT_TOKEN = "123456:TESTTOKEN";
  process.env.TELEGRAM_PRIMARY_CHAT_ID = "111";
  process.env.TELEGRAM_COPY_CHAT_IDS = "222, 333";
  delete process.env.TELEGRAM_MESSAGE_THREAD_ID;

  const lead = toCanonicalLead(validInput({ name: "DTM TEST" }));

  const bothOkCalls = [];
  const bothOk = await sendOwnerTelegram(lead, {
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init.body));
      bothOkCalls.push(body.chat_id);
      return new Response(
        JSON.stringify({ ok: true, result: { message_id: Number(body.chat_id) } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    },
  });
  assert("tg copy both primary ok", bothOk.ok === true && bothOk.messageId === 111);
  assert("tg copy both copies ok", bothOk.ok && bothOk.copies.length === 2 && bothOk.copies.every((c) => c.ok === true));
  assertEqual("tg copy both three chats", bothOkCalls.sort().join(","), "111,222,333");

  const copyFail = await sendOwnerTelegram(lead, {
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init.body));
      if (String(body.chat_id) === "222") {
        return new Response(JSON.stringify({ ok: false, description: "Forbidden: bot can't initiate conversation" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, result: { message_id: 700 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  assert("tg copy fail primary ok", copyFail.ok === true && copyFail.messageId === 700);
  assert("tg copy fail copy rejected", copyFail.ok && copyFail.copies[0]?.ok === false);

  const primaryFail = await sendOwnerTelegram(lead, {
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init.body));
      if (String(body.chat_id) === "111") {
        return new Response(JSON.stringify({ ok: false, description: "fail" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, result: { message_id: 800 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });
  assert("tg primary fail is fail", primaryFail.ok === false);
  assert("tg primary fail copy still attempted", primaryFail.copies[0]?.ok === true);

  restoreEnv(prev);
}

async function testEmailCopyMatrix() {
  const prev = snapshotEnv([
    "RESEND_API_KEY",
    "LEADS_FROM_EMAIL",
    "LEAD_EMAIL_TO",
    "LEAD_EMAIL_COPY_TO",
  ]);
  process.env.RESEND_API_KEY = "re_test_not_real";
  process.env.LEAD_EMAIL_TO = "client@example.com";
  process.env.LEADS_FROM_EMAIL = "DTM Website <onboarding@resend.dev>";
  process.env.LEAD_EMAIL_COPY_TO = "dev@example.com";

  const lead = toCanonicalLead(validInput());

  const bothTargets = [];
  const both = await sendOwnerEmail(lead, {
    send: async (payload) => {
      bothTargets.push(payload.to);
      return { data: { id: `id-${payload.to}` }, error: null };
    },
  });
  assert("email copy both primary ok", both.ok === true);
  assert("email copy both copy ok", both.ok && both.copy?.ok === true);
  assertEqual("email copy both two recipients", bothTargets.sort().join(","), "client@example.com,dev@example.com");

  const copyFail = await sendOwnerEmail(lead, {
    send: async (payload) => {
      if (payload.to === "dev@example.com") {
        return { data: null, error: { name: "validation_error", message: "denied" } };
      }
      return { data: { id: "primary-ok" }, error: null };
    },
  });
  assert("email copy fail primary ok", copyFail.ok === true && copyFail.messageId === "primary-ok");
  assert("email copy fail copy not ok", copyFail.ok && copyFail.copy?.ok === false);

  const primaryFail = await sendOwnerEmail(lead, {
    send: async (payload) => {
      if (payload.to === "client@example.com") {
        return { data: null, error: { name: "validation_error", message: "denied" } };
      }
      return { data: { id: "copy-ok" }, error: null };
    },
  });
  assert("email primary fail is fail", primaryFail.ok === false);
  assert("email primary fail copy still attempted", primaryFail.copy?.ok === true);

  restoreEnv(prev);
}

async function testCopyFailureDoesNotFailLead() {
  const cache = new SubmissionIdempotency(10 * 60 * 1000);
  const result = await deliverParsedLead(validInput(), cache, {
    sendTelegram: async () => ({
      ok: true,
      messageId: 1,
      statusCode: 200,
      durationMs: 1,
      copies: [{ ok: false, reason: "rejected", statusCode: 403 }],
    }),
    sendEmail: async () => ({
      ok: true,
      messageId: "em-ok",
      durationMs: 1,
      copy: { ok: false, reason: "resend_error" },
    }),
  });
  assertEqual("copy fail lead 200", result.status, 200);
  assert("copy fail telegram sent", result.body.ok && result.body.delivered.telegram === true);
  assert("copy fail email sent", result.body.ok && result.body.delivered.email === true);
}

async function testTelegramOkAnd429() {
  const prev = snapshotEnv([
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_PRIMARY_CHAT_ID",
    "TELEGRAM_COPY_CHAT_IDS",
  ]);
  process.env.TELEGRAM_BOT_TOKEN = "123456:TESTTOKEN";
  process.env.TELEGRAM_PRIMARY_CHAT_ID = "1";
  delete process.env.TELEGRAM_COPY_CHAT_IDS;

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

  restoreEnv(prev);
}

async function testDeliveryMatrix() {
  async function run(tg, em) {
    const cache = new SubmissionIdempotency(10 * 60 * 1000);
    return deliverParsedLead(validInput(), cache, {
      sendTelegram: async () => tg,
      sendEmail: async () => em,
    });
  }
  const sentTg = { ok: true, messageId: 1 };
  const failTg = { ok: false, reason: "timeout", errorType: "timeout" };
  const skipTg = { ok: false, reason: "unconfigured", errorType: "unconfigured" };
  const sentEm = { ok: true, messageId: "e1" };
  const failEm = { ok: false, reason: "resend_error", errorType: "resend_error" };
  const skipEm = { ok: false, reason: "unconfigured", errorType: "unconfigured" };

  const bothSent = await run(sentTg, sentEm);
  assertEqual("M both sent", bothSent.status, 200);
  const tgSentEmFail = await run(sentTg, failEm);
  assertEqual("M tg sent em fail", tgSentEmFail.status, 200);
  const tgFailEmSent = await run(failTg, sentEm);
  assertEqual("M tg fail em sent", tgFailEmSent.status, 200);
  const bothFail = await run(failTg, failEm);
  assertEqual("M both fail", bothFail.status, 503);
  const tgSentEmSkip = await run(sentTg, skipEm);
  assertEqual("M tg sent em skip", tgSentEmSkip.status, 200);
  const tgFailEmSkip = await run(failTg, skipEm);
  assertEqual("M tg fail em skip", tgFailEmSkip.status, 503);
  const tgSkipEmSent = await run(skipTg, sentEm);
  assertEqual("M tg skip em sent", tgSkipEmSent.status, 200);
  const tgSkipEmFail = await run(skipTg, failEm);
  assertEqual("M tg skip em fail", tgSkipEmFail.status, 503);
  const bothSkip = await run(skipTg, skipEm);
  assertEqual("M both skip", bothSkip.status, 503);
}

const tests = [
  ["intentional repeat", testIntentionalRepeat],
  ["accidental duplicate", testAccidentalDuplicate],
  ["inflight coalesce", testInflightCoalesce],
  ["retry after failed send", testRetryAfterFailedSend],
  ["email channel matrix A-E", testEmailChannelMatrix],
  ["delivery matrix", testDeliveryMatrix],
  ["email send controlled failures", testEmailSendControlledFailures],
  ["confirmed delivery guard", async () => testConfirmedDeliveryGuard()],
  ["phone mask", async () => testPhoneMask()],
  ["no duplicate after confirmed send", testNoDuplicateAfterConfirmedSend],
  ["session lifecycle", async () => testSessionLifecycle()],
  ["source guards", async () => testSourceGuards()],
  ["telegram ok and 429", testTelegramOkAnd429],
  ["telegram copy matrix", testTelegramCopyMatrix],
  ["email copy matrix", testEmailCopyMatrix],
  ["copy failure does not fail lead", testCopyFailureDoesNotFailLead],
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
