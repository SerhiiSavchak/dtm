import type { CanonicalLead } from "./format";
import { formatOwnerTelegram } from "./format";

const TELEGRAM_API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;

function isNumericChatId(value: string): boolean {
  return /^-?\d+$/.test(value.trim());
}

export type TelegramSendResult =
  | { ok: true; messageId: number }
  | { ok: false; reason: "unconfigured" | "invalid_chat" | "rejected" | "timeout" };

export async function sendOwnerTelegram(
  lead: CanonicalLead
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const threadRaw = process.env.TELEGRAM_MESSAGE_THREAD_ID?.trim();

  if (!token || !chatId) return { ok: false, reason: "unconfigured" };
  if (!isNumericChatId(chatId)) return { ok: false, reason: "invalid_chat" };

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: formatOwnerTelegram(lead),
    disable_web_page_preview: true,
  };

  if (threadRaw && /^\d+$/.test(threadRaw)) {
    body.message_thread_id = Number(threadRaw);
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; result?: { message_id?: number } }
      | null;

    if (!res.ok || !json?.ok || typeof json.result?.message_id !== "number") {
      return { ok: false, reason: "rejected" };
    }

    return { ok: true, messageId: json.result.message_id };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "rejected" };
  }
}
