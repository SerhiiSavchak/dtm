import { NextResponse } from "next/server";
import { toCanonicalLead, formatVisitorDraft } from "@/lib/leads/format";
import { sendOwnerEmail } from "@/lib/leads/email";
import { leadInputSchema } from "@/lib/leads/schema";
import { sendOwnerTelegram } from "@/lib/leads/telegram";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16_384;
const MIN_COMPLETION_MS = 4_000;
const MAX_COMPLETION_MS = 1000 * 60 * 60 * 24;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;

/**
 * Per-instance maps only. On Vercel these are not shared across lambdas,
 * so they cannot be relied on as global duplicate or rate-limit storage.
 */
const recentSubmissions = new Map<
  string,
  { at: number; body: ReturnType<typeof successBody> }
>();
const rateByIp = new Map<string, number[]>();

type ChannelStatus = "sent" | "failed" | "skipped";

function successBody(args: {
  leadId: string;
  visitorDraft: string;
  telegram: ChannelStatus;
  email: ChannelStatus;
}) {
  return {
    ok: true as const,
    leadId: args.leadId,
    visitorDraft: args.visitorDraft,
    delivered: {
      telegram: args.telegram === "sent",
      email: args.email === "sent",
    },
  };
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function pruneMap<T extends { at?: number } | number[]>(
  map: Map<string, T>,
  cutoff: number
) {
  for (const [key, value] of map) {
    if (Array.isArray(value)) {
      const next = value.filter((stamp) => stamp > cutoff);
      if (next.length) map.set(key, next as T);
      else map.delete(key);
    } else if (value && typeof value === "object" && "at" in value) {
      if ((value.at ?? 0) < cutoff) map.delete(key);
    }
  }
}

function allowRate(ip: string): boolean {
  const now = Date.now();
  pruneMap(rateByIp, now - RATE_WINDOW_MS);
  const stamps = rateByIp.get(ip) ?? [];
  const recent = stamps.filter((stamp) => stamp > now - RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    rateByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateByIp.set(ip, recent);
  return true;
}

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function safeLog(event: string, extra?: Record<string, unknown>) {
  console.info(`[leads] ${event}`, extra ?? {});
}

export async function POST(request: Request) {
  if (!originAllowed(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const ip = clientIp(request);
  if (!allowRate(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const input = parsed.data;
  const honeypot = input.honeypot?.trim();
  if (honeypot) {
    safeLog("honeypot");
    const fakeId = `DTM-0000-0000`;
    return NextResponse.json(
      successBody({
        leadId: fakeId,
        visitorDraft: "Вітаю! Я щойно заповнив(ла) форму на сайті DTM.",
        telegram: "sent",
        email: "sent",
      })
    );
  }

  const elapsed = Date.now() - input.formStartedAt;
  if (elapsed < MIN_COMPLETION_MS || elapsed > MAX_COMPLETION_MS) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const cached = recentSubmissions.get(input.submissionId);
  if (cached && Date.now() - cached.at < RATE_WINDOW_MS) {
    return NextResponse.json(cached.body);
  }

  let lead;
  try {
    lead = toCanonicalLead(input);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const [telegramResult, emailResult] = await Promise.allSettled([
    sendOwnerTelegram(lead),
    sendOwnerEmail(lead),
  ]);

  const telegram =
    telegramResult.status === "fulfilled" && telegramResult.value.ok
      ? "sent"
      : "failed";
  const email =
    emailResult.status === "fulfilled" && emailResult.value.ok
      ? "sent"
      : "failed";

  const telegramReason =
    telegramResult.status === "fulfilled" && !telegramResult.value.ok
      ? telegramResult.value.reason
      : telegramResult.status === "rejected"
        ? "rejected"
        : undefined;
  const emailReason =
    emailResult.status === "fulfilled" && !emailResult.value.ok
      ? emailResult.value.reason
      : emailResult.status === "rejected"
        ? "rejected"
        : undefined;

  if (telegram === "failed" && email === "failed") {
    safeLog("delivery_failed", {
      leadId: lead.leadId,
      telegram: telegramReason ?? "rejected",
      email: emailReason ?? "rejected",
    });
    return NextResponse.json({ ok: false, error: "delivery_failed" }, { status: 503 });
  }

  if (telegram === "failed") {
    safeLog("telegram_failed", {
      leadId: lead.leadId,
      reason: telegramReason ?? "rejected",
    });
  }
  if (email === "failed") {
    safeLog("email_failed", {
      leadId: lead.leadId,
      reason: emailReason ?? "rejected",
    });
  }

  const body = successBody({
    leadId: lead.leadId,
    visitorDraft: formatVisitorDraft(lead),
    telegram,
    email,
  });

  recentSubmissions.set(input.submissionId, { at: Date.now(), body });
  pruneMap(recentSubmissions, Date.now() - RATE_WINDOW_MS);

  safeLog("accepted", {
    leadId: lead.leadId,
    telegram,
    email,
  });

  return NextResponse.json(body);
}
