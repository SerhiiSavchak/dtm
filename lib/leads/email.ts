import { Resend } from "resend";
import type { CanonicalLead } from "./format";
import { formatOwnerEmail } from "./format";

const TIMEOUT_MS = 8000;

export type EmailFailReason = "unconfigured" | "rejected" | "timeout";

export type EmailSendResult =
  | { ok: true; messageId: string; durationMs: number }
  | {
      ok: false;
      reason: EmailFailReason;
      durationMs: number;
      errorType: EmailFailReason;
    };

function fail(reason: EmailFailReason, durationMs: number): EmailSendResult {
  return { ok: false, reason, durationMs, errorType: reason };
}

export async function sendOwnerEmail(lead: CanonicalLead): Promise<EmailSendResult> {
  const started = Date.now();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.LEADS_TO_EMAIL?.trim();
  const from = process.env.LEADS_FROM_EMAIL?.trim();

  if (!apiKey || !to || !from) return fail("unconfigured", Date.now() - started);

  const { subject, text, html } = formatOwnerEmail(lead);
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const resend = new Resend(apiKey);
    const result = await Promise.race([
      resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
      }),
      new Promise<never>((_, reject) => {
        const error = new Error("timeout");
        error.name = "TimeoutError";
        timer = setTimeout(() => reject(error), TIMEOUT_MS);
      }),
    ]);

    const durationMs = Date.now() - started;
    if (result.error || !result.data?.id) {
      return fail("rejected", durationMs);
    }

    return { ok: true, messageId: result.data.id, durationMs };
  } catch (error) {
    const durationMs = Date.now() - started;
    if (error instanceof Error && error.name === "TimeoutError") {
      return fail("timeout", durationMs);
    }
    return fail("rejected", durationMs);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
