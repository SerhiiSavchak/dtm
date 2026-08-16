import type { EmailSendResult } from "./email";
import { formatVisitorDraft, toCanonicalLead } from "./format";
import type { SubmissionIdempotency } from "./idempotency";
import type { LeadInput } from "./schema";
import type { TelegramSendResult } from "./telegram";

export type ChannelStatus = "sent" | "failed" | "skipped";

export type LeadSuccessBody = {
  ok: true;
  leadId: string;
  visitorDraft: string;
  delivered: {
    telegram: boolean;
    email: boolean;
  };
  duplicate?: boolean;
};

export type LeadProcessResult = {
  status: number;
  body: LeadSuccessBody | { ok: false; error: string };
  telegramAttempted: boolean;
  telegramMessageId?: number;
};

export type LeadChannelSenders = {
  sendTelegram: (lead: ReturnType<typeof toCanonicalLead>) => Promise<TelegramSendResult>;
  sendEmail: (lead: ReturnType<typeof toCanonicalLead>) => Promise<EmailSendResult>;
};

function successBody(args: {
  leadId: string;
  visitorDraft: string;
  telegram: ChannelStatus;
  email: ChannelStatus;
}): LeadSuccessBody {
  return {
    ok: true,
    leadId: args.leadId,
    visitorDraft: args.visitorDraft,
    delivered: {
      telegram: args.telegram === "sent",
      email: args.email === "sent",
    },
  };
}

function safeLog(event: string, extra?: Record<string, unknown>) {
  console.info(`[leads] ${event}`, extra ?? {});
}

function duplicateBody(body: LeadSuccessBody): LeadSuccessBody {
  return { ...body, duplicate: true };
}

/**
 * Same submissionId → at most one Telegram on this instance.
 * New submissionId → new lead even if phone/answers/IP are identical.
 * Failed delivery is not cached, so a retry of the same ID may send.
 */
export async function deliverParsedLead(
  input: LeadInput,
  cache: SubmissionIdempotency<LeadSuccessBody>,
  senders: LeadChannelSenders
): Promise<LeadProcessResult> {
  const cached = cache.getDone(input.submissionId);
  if (cached) {
    safeLog("duplicate", {
      leadId: cached.leadId,
      submissionId: input.submissionId,
    });
    return {
      status: 200,
      body: duplicateBody(cached),
      telegramAttempted: false,
    };
  }

  const inflight = cache.getInflight(input.submissionId);
  if (inflight) {
    try {
      const body = await inflight;
      safeLog("duplicate", {
        leadId: body.leadId,
        submissionId: input.submissionId,
        coalesced: true,
      });
      return {
        status: 200,
        body: duplicateBody(body),
        telegramAttempted: false,
      };
    } catch {
      // First attempt did not confirm delivery — fall through and retry.
    }
  }

  let settle!: (body: LeadSuccessBody) => void;
  let failGate!: (error: Error) => void;
  const gate = new Promise<LeadSuccessBody>((resolve, reject) => {
    settle = resolve;
    failGate = reject;
  });
  void gate.catch(() => {});
  cache.setInflight(input.submissionId, gate);

  let lead;
  try {
    lead = toCanonicalLead(input);
  } catch {
    cache.fail(input.submissionId);
    failGate(new Error("invalid_payload"));
    return {
      status: 400,
      body: { ok: false, error: "invalid_payload" },
      telegramAttempted: false,
    };
  }

  try {
    const [telegramResult, emailResult] = await Promise.allSettled([
      senders.sendTelegram(lead),
      senders.sendEmail(lead),
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

    const telegramMessageId =
      telegramResult.status === "fulfilled" && telegramResult.value.ok
        ? telegramResult.value.messageId
        : undefined;

    if (telegram === "failed" && email === "failed") {
      cache.fail(input.submissionId);
      failGate(new Error("delivery_failed"));
      safeLog("delivery_failed", {
        leadId: lead.leadId,
        submissionId: input.submissionId,
        telegram: telegramReason ?? "rejected",
        email: emailReason ?? "rejected",
      });
      return {
        status: 503,
        body: { ok: false, error: "delivery_failed" },
        telegramAttempted: true,
      };
    }

    if (telegram === "failed") {
      safeLog("telegram_failed", {
        leadId: lead.leadId,
        submissionId: input.submissionId,
        reason: telegramReason ?? "rejected",
      });
    }
    if (email === "failed") {
      safeLog("email_failed", {
        leadId: lead.leadId,
        submissionId: input.submissionId,
        reason: emailReason ?? "rejected",
      });
    }

    const body = successBody({
      leadId: lead.leadId,
      visitorDraft: formatVisitorDraft(lead),
      telegram,
      email,
    });

    cache.succeed(input.submissionId, body);
    settle(body);

    safeLog("accepted", {
      leadId: lead.leadId,
      submissionId: input.submissionId,
      telegram,
      email,
      ...(telegramMessageId != null ? { telegramMessageId } : {}),
    });

    return {
      status: 200,
      body,
      telegramAttempted: true,
      telegramMessageId,
    };
  } catch (error) {
    cache.fail(input.submissionId);
    failGate(error instanceof Error ? error : new Error("delivery_failed"));
    throw error;
  }
}
