import type { CanonicalLead } from "./format";
import { formatOwnerTelegram } from "./format";

const TELEGRAM_API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;
const MAX_RETRY_AFTER_MS = 2000;

function isNumericChatId(value: string): boolean {
  return /^-?\d+$/.test(value.trim());
}

export type TelegramSendResult =
  | { ok: true; messageId: number }
  | { ok: false; reason: "unconfigured" | "invalid_chat" | "rejected" | "timeout" };

type TelegramApiJson = {
  ok?: boolean;
  parameters?: { retry_after?: number };
  result?: { message_id?: number };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSendResult(
  res: Response,
  json: TelegramApiJson | null
): TelegramSendResult | { retryAfterMs: number } {
  if (res.status === 429) {
    const retryAfterSec = Number(json?.parameters?.retry_after);
    if (Number.isFinite(retryAfterSec) && retryAfterSec > 0) {
      return { retryAfterMs: Math.min(retryAfterSec * 1000, MAX_RETRY_AFTER_MS) };
    }
    return { ok: false, reason: "rejected" };
  }

  if (!res.ok || !json?.ok || typeof json.result?.message_id !== "number") {
    return { ok: false, reason: "rejected" };
  }

  return { ok: true, messageId: json.result.message_id };
}

async function postSendMessage(
  url: string,
  serialized: string,
  fetchImpl: typeof fetch
): Promise<{ res: Response; json: TelegramApiJson | null }> {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: serialized,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => null)) as TelegramApiJson | null;
  return { res, json };
}

export async function sendOwnerTelegram(
  lead: CanonicalLead,
  deps?: { fetch?: typeof fetch }
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const threadRaw = process.env.TELEGRAM_MESSAGE_THREAD_ID?.trim();
  const fetchImpl = deps?.fetch ?? fetch;

  if (!token || !chatId) return { ok: false, reason: "unconfigured" };
  if (!isNumericChatId(chatId)) return { ok: false, reason: "invalid_chat" };

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: formatOwnerTelegram(lead),
    disable_web_page_preview: true,
  };

  if (threadRaw && /^\d+$/.test(threadRaw)) {
    payload.message_thread_id = Number(threadRaw);
  }

  const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
  const serialized = JSON.stringify(payload);

  try {
    const first = await postSendMessage(url, serialized, fetchImpl);
    const parsed = parseSendResult(first.res, first.json);
    if ("retryAfterMs" in parsed) {
      await sleep(parsed.retryAfterMs);
      const second = await postSendMessage(url, serialized, fetchImpl);
      const retried = parseSendResult(second.res, second.json);
      if ("retryAfterMs" in retried) {
        return { ok: false, reason: "rejected" };
      }
      return retried;
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "rejected" };
  }
}
