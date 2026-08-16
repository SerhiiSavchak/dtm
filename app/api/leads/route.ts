import { NextResponse } from "next/server";
import { sendOwnerEmail } from "@/lib/leads/email";
import { SubmissionIdempotency } from "@/lib/leads/idempotency";
import {
  deliverParsedLead,
  type LeadSuccessBody,
} from "@/lib/leads/process-lead";
import { leadInputSchema } from "@/lib/leads/schema";
import { sendOwnerTelegram } from "@/lib/leads/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;
const MIN_COMPLETION_MS = 4_000;
const MAX_COMPLETION_MS = 1000 * 60 * 60 * 24;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;

/**
 * Per-instance maps only. On Vercel these are not shared across lambdas,
 * so they cannot be relied on as global duplicate or rate-limit storage.
 * Keyed by submissionId — never a process-wide “alreadySent” boolean.
 */
const recentSubmissions = new SubmissionIdempotency<LeadSuccessBody>(RATE_WINDOW_MS);
const rateByIp = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function pruneRate(cutoff: number) {
  for (const [key, stamps] of rateByIp) {
    const next = stamps.filter((stamp) => stamp > cutoff);
    if (next.length) rateByIp.set(key, next);
    else rateByIp.delete(key);
  }
}

function allowRate(ip: string): boolean {
  const now = Date.now();
  pruneRate(now - RATE_WINDOW_MS);
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

function honeypotBody(): LeadSuccessBody {
  return {
    ok: true,
    leadId: "DTM-0000-0000",
    visitorDraft: "Вітаю! Я щойно заповнив(ла) форму на сайті DTM.",
    delivered: { telegram: true, email: true },
  };
}

export async function POST(request: Request) {
  if (!originAllowed(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "too_large" }, { status: 413 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    const ip = clientIp(request);
    if (!allowRate(ip)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadInputSchema.safeParse(json);
  if (parsed.success) {
    const replay = recentSubmissions.getDone(parsed.data.submissionId);
    if (replay) {
      console.info("[leads] duplicate", {
        leadId: replay.leadId,
        submissionId: parsed.data.submissionId,
      });
      return NextResponse.json({ ...replay, duplicate: true });
    }
  }

  const ip = clientIp(request);
  if (!allowRate(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const input = parsed.data;
  const honeypot = input.honeypot?.trim();
  if (honeypot) {
    console.info("[leads] honeypot");
    return NextResponse.json(honeypotBody());
  }

  const elapsed = Date.now() - input.formStartedAt;
  if (elapsed < MIN_COMPLETION_MS || elapsed > MAX_COMPLETION_MS) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const result = await deliverParsedLead(input, recentSubmissions, {
    sendTelegram: sendOwnerTelegram,
    sendEmail: sendOwnerEmail,
  });

  return NextResponse.json(result.body, { status: result.status });
}
