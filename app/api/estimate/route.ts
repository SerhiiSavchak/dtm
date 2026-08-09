import { NextResponse } from "next/server";
import type { EstimatePayload } from "@/lib/calculator/types";

/**
 * Estimate lead intake.
 *
 * Wire later via env (never expose client-side):
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_CHAT_ID
 *   ESTIMATE_NOTIFY_EMAIL
 *   SMTP_* or provider API keys
 *
 * Until credentials exist, we validate and acknowledge without inventing
 * delivery targets.
 */

const OBJECT_TYPES = new Set(["apartment", "house", "commercial"]);
const RENOVATION = new Set(["cosmetic", "capital", "turnkey"]);
const DESIGN = new Set(["yes", "no", "consult"]);
const CONDITION = new Set(["newbuild", "secondary", "demolished", "other"]);
const START = new Set(["asap", "1-3", "3-6", "later"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePayload(body: unknown): EstimatePayload | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;

  if (!OBJECT_TYPES.has(String(data.objectType))) return null;
  if (!RENOVATION.has(String(data.renovationType))) return null;
  if (!DESIGN.has(String(data.design))) return null;
  if (!CONDITION.has(String(data.condition))) return null;
  if (!START.has(String(data.start))) return null;
  if (!isNonEmptyString(data.name)) return null;
  if (!isNonEmptyString(data.phone)) return null;

  const area = Number(data.area);
  if (!Number.isFinite(area) || area < 1 || area > 2000) return null;

  let rooms: number | null = null;
  if (data.rooms !== null && data.rooms !== undefined && data.rooms !== "") {
    const parsed = Number(data.rooms);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 30) return null;
    rooms = parsed;
  }

  const phone = String(data.phone).replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length < 9) return null;

  const telegram =
    typeof data.telegram === "string" && data.telegram.trim()
      ? data.telegram.trim()
      : undefined;

  const locale = data.locale === "en" ? "en" : "uk";

  return {
    objectType: data.objectType as EstimatePayload["objectType"],
    area,
    rooms,
    renovationType: data.renovationType as EstimatePayload["renovationType"],
    design: data.design as EstimatePayload["design"],
    condition: data.condition as EstimatePayload["condition"],
    start: data.start as EstimatePayload["start"],
    name: String(data.name).trim(),
    phone,
    telegram,
    locale,
  };
}

function formatMessage(payload: EstimatePayload): string {
  return [
    "DTM — новий запит на попередній розрахунок",
    `Ім’я: ${payload.name}`,
    `Телефон: ${payload.phone}`,
    payload.telegram ? `Telegram: ${payload.telegram}` : null,
    `Об’єкт: ${payload.objectType}`,
    `Площа: ${payload.area} м²`,
    payload.rooms != null ? `Кімнати: ${payload.rooms}` : null,
    `Тип ремонту: ${payload.renovationType}`,
    `Дизайн: ${payload.design}`,
    `Стан: ${payload.condition}`,
    `Старт: ${payload.start}`,
    `Мова: ${payload.locale}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function notifyTelegram(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  return res.ok;
}

async function notifyEmail(message: string, payload: EstimatePayload) {
  const to = process.env.ESTIMATE_NOTIFY_EMAIL;
  // Placeholder boundary — integrate SMTP / Resend / etc. when credentials exist.
  if (!to) return false;
  void message;
  void payload;
  return false;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const payload = validatePayload(json);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const message = formatMessage(payload);

  try {
    const [telegramOk, emailOk] = await Promise.all([
      notifyTelegram(message),
      notifyEmail(message, payload),
    ]);

    if (process.env.NODE_ENV === "development") {
      console.info("[estimate]", {
        delivered: { telegram: telegramOk, email: emailOk },
        payload,
      });
    }

    // Accept the lead even when delivery channels are not configured yet.
    // Frontend shows a success state; ops can wire credentials later.
    return NextResponse.json({
      ok: true,
      delivered: {
        telegram: telegramOk,
        email: emailOk,
      },
    });
  } catch (error) {
    console.error("[estimate] delivery failed", error);
    return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 500 });
  }
}
