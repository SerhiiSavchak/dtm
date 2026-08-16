import { Resend } from "resend";
import type { CanonicalLead } from "./format";
import { formatOwnerEmail } from "./format";

const TIMEOUT_MS = 8000;

export type EmailSendResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: "unconfigured" | "rejected" | "timeout" };

export async function sendOwnerEmail(lead: CanonicalLead): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.LEADS_TO_EMAIL?.trim();
  const from = process.env.LEADS_FROM_EMAIL?.trim();

  if (!apiKey || !to || !from) return { ok: false, reason: "unconfigured" };

  const { subject, text, html } = formatOwnerEmail(lead);

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
        setTimeout(() => reject(error), TIMEOUT_MS);
      }),
    ]);

    if (result.error || !result.data?.id) {
      return { ok: false, reason: "rejected" };
    }

    return { ok: true, messageId: result.data.id };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "rejected" };
  }
}
