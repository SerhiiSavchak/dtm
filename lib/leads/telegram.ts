import type { CanonicalLead } from "./format";
import { formatOwnerTelegram } from "./format";

const TELEGRAM_API = "https://api.telegram.org";
const TIMEOUT_MS = 8000;
const MAX_RETRY_AFTER_MS = 2000;

function isNumericChatId(value: string): boolean {
  return /^-?\d+$/.test(value.trim());
}

export type TelegramFailReason =
  | "unconfigured"
  | "invalid_chat"
  | "rejected"
  | "timeout";

export type TelegramCopyAttempt = {
  ok: boolean;
  reason?: TelegramFailReason;
  statusCode?: number;
};

export type TelegramSendResult =
  | {
      ok: true;
      messageId: number;
      statusCode: number;
      durationMs: number;
      copies: TelegramCopyAttempt[];
      partner?: TelegramCopyAttempt;
    }
  | {
      ok: false;
      reason: TelegramFailReason;
      statusCode?: number;
      durationMs: number;
      errorType: TelegramFailReason;
      copies: TelegramCopyAttempt[];
      partner?: TelegramCopyAttempt;
    };

type TelegramApiJson = {
  ok?: boolean;
  description?: string;
  parameters?: { retry_after?: number };
  result?: { message_id?: number };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(
  reason: TelegramFailReason,
  durationMs: number,
  statusCode?: number,
  copies: TelegramCopyAttempt[] = []
): TelegramSendResult {
  return { ok: false, reason, durationMs, errorType: reason, statusCode, copies };
}

function parseChatIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\s]+/)) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Primary client chat. */
export function resolveTelegramPrimaryChatId(): string | undefined {
  const primary = process.env.TELEGRAM_PRIMARY_CHAT_ID?.trim();
  return primary || undefined;
}

/** Developer/ops copies. Primary id is excluded to avoid a double-send. */
export function resolveTelegramCopyChatIds(primary?: string): string[] {
  const ids = parseChatIds(process.env.TELEGRAM_COPY_CHAT_IDS);
  return primary ? ids.filter((id) => id !== primary) : ids;
}

/** Optional partner copy. Missing/empty env is skipped. Primary id is excluded. */
export function resolveTelegramPartnerChatId(primary?: string): string | undefined {
  const id = process.env.TELEGRAM_PARTNER_CHAT_ID?.trim();
  if (!id) return undefined;
  if (primary && id === primary) return undefined;
  return id;
}

function parseSendResult(
  res: Response,
  json: TelegramApiJson | null,
  durationMs: number
): TelegramSendResult | { retryAfterMs: number } {
  if (res.status === 429) {
    const retryAfterSec = Number(json?.parameters?.retry_after);
    if (Number.isFinite(retryAfterSec) && retryAfterSec > 0) {
      return { retryAfterMs: Math.min(retryAfterSec * 1000, MAX_RETRY_AFTER_MS) };
    }
    return fail("rejected", durationMs, res.status);
  }

  if (!res.ok || !json?.ok || typeof json.result?.message_id !== "number") {
    return fail("rejected", durationMs, res.status);
  }

  return {
    ok: true,
    messageId: json.result.message_id,
    statusCode: res.status,
    durationMs,
    copies: [],
  };
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

async function sendToChat(args: {
  token: string;
  chatId: string;
  text: string;
  threadId?: number;
  fetchImpl: typeof fetch;
  started: number;
}): Promise<TelegramSendResult> {
  if (!isNumericChatId(args.chatId)) {
    return fail("invalid_chat", Date.now() - args.started);
  }

  const payload: Record<string, unknown> = {
    chat_id: args.chatId,
    text: args.text,
    disable_web_page_preview: true,
  };
  if (args.threadId != null) payload.message_thread_id = args.threadId;

  const url = `${TELEGRAM_API}/bot${args.token}/sendMessage`;
  const serialized = JSON.stringify(payload);

  try {
    const first = await postSendMessage(url, serialized, args.fetchImpl);
    const parsed = parseSendResult(first.res, first.json, Date.now() - args.started);
    if ("retryAfterMs" in parsed) {
      await sleep(parsed.retryAfterMs);
      const second = await postSendMessage(url, serialized, args.fetchImpl);
      const retried = parseSendResult(
        second.res,
        second.json,
        Date.now() - args.started
      );
      if ("retryAfterMs" in retried) {
        return fail("rejected", Date.now() - args.started, second.res.status);
      }
      return retried;
    }
    return parsed;
  } catch (error) {
    const durationMs = Date.now() - args.started;
    if (error instanceof Error && error.name === "TimeoutError") {
      return fail("timeout", durationMs);
    }
    return fail("rejected", durationMs);
  }
}

function toCopyAttempt(result: TelegramSendResult): TelegramCopyAttempt {
  if (result.ok) return { ok: true, statusCode: result.statusCode };
  return {
    ok: false,
    reason: result.reason,
    statusCode: result.statusCode,
  };
}

/**
 * Sends to the primary client chat and independently to copy/partner chats.
 * Channel success is PRIMARY only. Copy and partner failures never flip ok to false.
 */
export async function sendOwnerTelegram(
  lead: CanonicalLead,
  deps?: { fetch?: typeof fetch }
): Promise<TelegramSendResult> {
  const started = Date.now();
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = resolveTelegramPrimaryChatId();
  const copyIds = resolveTelegramCopyChatIds(chatId);
  const partnerId = resolveTelegramPartnerChatId(chatId);
  const threadRaw = process.env.TELEGRAM_MESSAGE_THREAD_ID?.trim();
  const fetchImpl = deps?.fetch ?? fetch;

  if (!token || !chatId) return fail("unconfigured", Date.now() - started);
  if (!isNumericChatId(chatId)) return fail("invalid_chat", Date.now() - started);

  const threadId = threadRaw && /^\d+$/.test(threadRaw) ? Number(threadRaw) : undefined;
  const text = formatOwnerTelegram(lead);

  const [primary, ...rest] = await Promise.all([
    sendToChat({
      token,
      chatId,
      text,
      threadId,
      fetchImpl,
      started,
    }),
    ...copyIds.map((copyId) =>
      sendToChat({
        token,
        chatId: copyId,
        text,
        fetchImpl,
        started,
      })
    ),
    ...(partnerId
      ? [
          sendToChat({
            token,
            chatId: partnerId,
            text,
            fetchImpl,
            started,
          }),
        ]
      : []),
  ]);

  const copyResults = rest.slice(0, copyIds.length);
  const copies = copyResults.map(toCopyAttempt);
  const partnerResult = partnerId ? rest[copyIds.length] : undefined;
  const partner = partnerResult ? toCopyAttempt(partnerResult) : undefined;

  if (primary.ok) {
    return { ...primary, copies, ...(partner ? { partner } : {}) };
  }
  return { ...primary, copies, ...(partner ? { partner } : {}) };
}
