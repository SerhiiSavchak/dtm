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

export type EmailSendResult =
  | { ok: true; messageId: string; durationMs: number }
  | {
      ok: false;
      reason: EmailFailReason;
      durationMs: number;
      errorType: EmailFailReason;
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

function fail(reason: EmailFailReason, durationMs: number): EmailSendResult {
  return { ok: false, reason, durationMs, errorType: reason };
}

function looksLikeAddress(value: string): boolean {
  return value.includes("@") && value.length >= 5;
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

export async function sendOwnerEmail(
  lead: CanonicalLead,
  deps?: { send?: ResendSendFn }
): Promise<EmailSendResult> {
  const started = Date.now();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.LEADS_TO_EMAIL?.trim();
  const from = process.env.LEADS_FROM_EMAIL?.trim();

  if (!apiKey || !to || !from) return fail("unconfigured", Date.now() - started);
  if (!looksLikeAddress(to) || !looksLikeAddress(from)) {
    return fail("invalid_configuration", Date.now() - started);
  }

  const { subject, text, html } = formatOwnerEmail(lead);
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const send = deps?.send ?? defaultSend(apiKey);
    const result = await Promise.race([
      send({ from, to, subject, html, text }),
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

    return { ok: true, messageId: result.data.id, durationMs };
  } catch (error) {
    return fail(classifyThrown(error), Date.now() - started);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
