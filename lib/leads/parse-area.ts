export type AreaParseResult =
  | { ok: true; value: number }
  | { ok: false; reason: "empty" | "zero" | "digits" };

/**
 * Parse a visitor-entered approximate area.
 * Accepts spaces, a single decimal comma or point. Rejects letters, signs, exponents.
 */
export function parseArea(raw: string): AreaParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  const compact = trimmed.replace(/\s+/g, "");
  if (/[eE]/.test(compact) || /[+-]/.test(compact)) {
    return { ok: false, reason: "digits" };
  }
  if (!/^\d+([.,]\d+)?$/.test(compact)) {
    return { ok: false, reason: "digits" };
  }

  const normalized = compact.replace(",", ".");
  if (normalized.startsWith(".")) return { ok: false, reason: "digits" };

  const value = Number(normalized);
  if (!Number.isFinite(value)) return { ok: false, reason: "digits" };
  if (value <= 0) return { ok: false, reason: "zero" };

  return { ok: true, value };
}

/** Keep digits, one decimal separator, and spaces while typing. */
export function sanitizeAreaInput(raw: string): string {
  return raw.replace(/[^\d.,\s]/g, "");
}

export function formatAreaDisplay(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(value);
}
