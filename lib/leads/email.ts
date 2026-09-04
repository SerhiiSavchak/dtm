import { Resend } from "resend";
import type { CanonicalLead } from "./format";
import { formatOwnerEmail } from "./format";

const TIMEOUT_MS = 8000;

export type EmailFailReason =
  | "unconfigured"
  | "invalid_configuration"
  | "resend_error"
  | "network_error"
  | "timeout"
  | "unexpected_error";

export type EmailCopyAttempt = {
  ok: boolean;
  reason?: EmailFailReason;
};

export type EmailSendResult =
  | { ok: true; messageId: string; durationMs: number; copy: EmailCopyAttempt | null }
  | {
      ok: false;
      reason: EmailFailReason;
      durationMs: number;
      errorType: EmailFailReason;
      copy: EmailCopyAttempt | null;
    };

export type ResendSendPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type ResendSendFn = (payload: ResendSendPayload) => Promise<{
  data?: { id?: string } | null;
  error?: { name?: string; message?: string } | null;
}>;

function fail(
  reason: EmailFailReason,
  durationMs: number,
  copy: EmailCopyAttempt | null = null
): EmailSendResult {
  return { ok: false, reason, durationMs, errorType: reason, copy };
}

function looksLikeAddress(value: string): boolean {
  return value.includes("@") && value.length >= 5;
}

function normalizeAddress(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/** Primary client inbox. */
export function resolveLeadEmailTo(): string | undefined {
  return normalizeAddress(process.env.LEAD_EMAIL_TO);
}

/** Developer/ops copy. Same address as primary is ignored (no double-send). */
export function resolveLeadEmailCopyTo(primary?: string): string | undefined {
  const copy = normalizeAddress(process.env.LEAD_EMAIL_COPY_TO);
  if (!copy) return undefined;
  if (primary && copy.toLowerCase() === primary.toLowerCase()) return undefined;
  return copy;
}

function classifyThrown(error: unknown): EmailFailReason {
  if (error instanceof Error && error.name === "TimeoutError") return "timeout";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  if (error instanceof TypeError) return "network_error";
  if (error instanceof Error && /fetch|network|ECONN|ENOTFOUND/i.test(error.message)) {
    return "network_error";
  }
  return "unexpected_error";
}

function defaultSend(apiKey: string): ResendSendFn {
  const resend = new Resend(apiKey);
  return (payload) => resend.emails.send(payload);
}

async function sendOne(
  payload: ResendSendPayload,
  send: ResendSendFn,
  started: number
): Promise<EmailSendResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      send(payload),
      new Promise<never>((_, reject) => {
        const error = new Error("timeout");
        error.name = "TimeoutError";
        timer = setTimeout(() => reject(error), TIMEOUT_MS);
      }),
    ]);

    const durationMs = Date.now() - started;
    if (result.error || !result.data?.id) {
      return fail("resend_error", durationMs);
    }

    return { ok: true, messageId: result.data.id, durationMs, copy: null };
  } catch (error) {
    return fail(classifyThrown(error), Date.now() - started);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function toCopyAttempt(result: EmailSendResult): EmailCopyAttempt {
  if (result.ok) return { ok: true };
  return { ok: false, reason: result.reason };
}

/**
 * Sends to the primary client inbox and independently to the developer copy.
 * Channel success is PRIMARY only. Copy failure never flips ok to false.
 */
export async function sendOwnerEmail(
  lead: CanonicalLead,
  deps?: { send?: ResendSendFn }
): Promise<EmailSendResult> {
  const started = Date.now();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = resolveLeadEmailTo();
  const from = process.env.LEADS_FROM_EMAIL?.trim();
  const copyTo = resolveLeadEmailCopyTo(to);

  if (!apiKey || !to || !from) return fail("unconfigured", Date.now() - started);
  if (!looksLikeAddress(to) || !looksLikeAddress(from)) {
    return fail("invalid_configuration", Date.now() - started);
  }

  const { subject, text, html } = formatOwnerEmail(lead);
  const send = deps?.send ?? defaultSend(apiKey);
  const primaryPayload: ResendSendPayload = { from, to, subject, html, text };

  if (!copyTo) {
    return sendOne(primaryPayload, send, started);
  }
  if (!looksLikeAddress(copyTo)) {
    const primary = await sendOne(primaryPayload, send, started);
    const copyAttempt: EmailCopyAttempt = {
      ok: false,
      reason: "invalid_configuration",
    };
    return { ...primary, copy: copyAttempt };
  }

  const copyPayload: ResendSendPayload = {
    from,
    to: copyTo,
    subject,
    html,
    text,
  };

  const [primary, copy] = await Promise.all([
    sendOne(primaryPayload, send, started),
    sendOne(copyPayload, send, started),
  ]);

  const copyAttempt = toCopyAttempt(copy);
  if (primary.ok) {
    return { ...primary, copy: copyAttempt };
  }
  return { ...primary, copy: copyAttempt };
}
