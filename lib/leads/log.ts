export type LeadLogLevel = "info" | "error";

export type LeadLogEvent =
  | "lead_received"
  | "lead_validation_success"
  | "lead_validation_failed"
  | "telegram_send_started"
  | "telegram_send_success"
  | "telegram_send_failed"
  | "telegram_copy_failed"
  | "telegram_partner_failed"
  | "email_send_started"
  | "email_send_success"
  | "email_send_failed"
  | "email_copy_failed"
  | "lead_completed"
  | "lead_failed";

/** Last 4 characters only, for support correlation — never a full phone. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `*******${digits.slice(-4)}`;
}

export function logLead(
  event: LeadLogEvent,
  fields: Record<string, unknown>,
  level: LeadLogLevel = "info"
) {
  const payload = { event, ...fields };
  if (level === "error") {
    console.error(payload);
    return;
  }
  console.info(payload);
}
