import { parsePhoneNumberFromString } from "libphonenumber-js/min";

const MAX_PHONE_CHARS = 24;

/** Allow digits and common separators while typing. Keep a leading +. */
export function sanitizePhoneInput(raw: string): string {
  const stripped = raw.replace(/[^\d+()\s-]/g, "").slice(0, MAX_PHONE_CHARS);
  const plusCount = (stripped.match(/\+/g) || []).length;
  if (plusCount <= 1) return stripped;
  const first = stripped.indexOf("+");
  return stripped.slice(0, first + 1) + stripped.slice(first + 1).replace(/\+/g, "");
}

/**
 * Normalize a visitor phone to E.164.
 * Default region is Ukraine so `0671234567` and `+380671234567` both work.
 * Other valid international numbers are kept when libphonenumber accepts them.
 */
export function normalizePhone(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;

  const parsed = parsePhoneNumberFromString(input, "UA");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format("E.164");
}

export function isPlausiblePhonePartial(raw: string): boolean {
  return sanitizePhoneInput(raw).replace(/\D/g, "").length > 0;
}
