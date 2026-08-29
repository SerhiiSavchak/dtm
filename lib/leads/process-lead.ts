import type { EmailSendResult } from "./email";
import { formatVisitorDraft, toCanonicalLead } from "./format";
import type { SubmissionIdempotency } from "./idempotency";
import { logLead } from "./log";
import type { LeadInput } from "./schema";
import type { TelegramSendResult } from "./telegram";

export type ChannelStatus = "sent" | "failed" | "not_configured";

export type LeadSuccessBody = {
  ok: true;
  leadId: string;
  requestId: string;
  visitorDraft: string;
  delivered: {
    telegram: boolean;
    email: boolean;
  };
  duplicate?: boolean;
};

export type LeadProcessResult = {
  status: number;
  body: LeadSuccessBody | { ok: false; error: string; requestId: string };
  telegramAttempted: boolean;
  telegramMessageId?: number;
};

export type LeadChannelSenders = {
  sendTelegram: (lead: ReturnType<typeof toCanonicalLead>) => Promise<TelegramSendResult>;
  sendEmail: (lead: ReturnType<typeof toCanonicalLead>) => Promise<EmailSendResult>;
};

function successBody(args: {
  leadId: string;
  requestId: string;
  visitorDraft: string;
  telegram: ChannelStatus;
  email: ChannelStatus;
}): LeadSuccessBody {
  return {
    ok: true,
    leadId: args.leadId,
    requestId: args.requestId,
    visitorDraft: args.visitorDraft,
    delivered: {
      telegram: args.telegram === "sent",
      email: args.email === "sent",
    },
  };
}

function duplicateBody(body: LeadSuccessBody): LeadSuccessBody {
  return { ...body, duplicate: true };
}

export function channelFromTelegram(
  result: PromiseSettledResult<TelegramSendResult>
): ChannelStatus {
  if (result.status !== "fulfilled") return "failed";
  if (result.value.ok) return "sent";
  if (result.value.reason === "unconfigured") return "not_configured";
  return "failed";
}

export function channelFromEmail(
  result: PromiseSettledResult<EmailSendResult>
): ChannelStatus {
  if (result.status !== "fulfilled") return "failed";
  if (result.value.ok) return "sent";
  if (result.value.reason === "unconfigured") return "not_configured";
  return "failed";
}

/** At least one configured channel delivered. Unconfigured is not a failure. */
export function isLeadDelivered(
  telegram: ChannelStatus,
  email: ChannelStatus
): boolean {
  return telegram === "sent" || email === "sent";
}

/**
 * Same submissionId → at most one send on this instance.
 * New submissionId → new lead even if phone/answers/IP are identical.
 * Failed delivery is not cached, so a retry of the same ID may send.
 * Success if any configured channel sent. Zero configured channels → failure.
 */
export async function deliverParsedLead(
  input: LeadInput,
  cache: SubmissionIdempotency<LeadSuccessBody>,
  senders: LeadChannelSenders,
  requestId = crypto.randomUUID()
): Promise<LeadProcessResult> {
  const cached = cache.getDone(input.submissionId);
  if (cached) {
    logLead("lead_completed", {
      requestId,
      leadId: cached.leadId,
      duplicate: true,
    });
    return {
      status: 200,
      body: { ...duplicateBody(cached), requestId },
      telegramAttempted: false,
    };
  }

  const inflight = cache.getInflight(input.submissionId);
  if (inflight) {
    try {
      const body = await inflight;
      logLead("lead_completed", {
        requestId,
        leadId: body.leadId,
        duplicate: true,
        coalesced: true,
      });
      return {
        status: 200,
        body: { ...duplicateBody(body), requestId },
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
    logLead(
      "lead_failed",
      { requestId, errorType: "invalid_payload" },
      "error"
    );
    return {
      status: 400,
      body: { ok: false, error: "invalid_payload", requestId },
      telegramAttempted: false,
    };
  }

  try {
    logLead("telegram_send_started", { requestId, leadId: lead.leadId });
    logLead("email_send_started", { requestId, leadId: lead.leadId });

    const [telegramResult, emailResult] = await Promise.allSettled([
      senders.sendTelegram(lead),
      senders.sendEmail(lead),
    ]);

    const telegram = channelFromTelegram(telegramResult);
    const email = channelFromEmail(emailResult);

    if (telegram === "sent" && telegramResult.status === "fulfilled" && telegramResult.value.ok) {
      logLead("telegram_send_success", {
        requestId,
        leadId: lead.leadId,
        durationMs: telegramResult.value.durationMs,
        statusCode: telegramResult.value.statusCode,
      });
    } else {
      const value =
        telegramResult.status === "fulfilled" ? telegramResult.value : null;
      const unconfigured = telegram === "not_configured";
      logLead(
        "telegram_send_failed",
        {
          requestId,
          leadId: lead.leadId,
          durationMs: value && !value.ok ? value.durationMs : undefined,
          statusCode: value && !value.ok ? value.statusCode : undefined,
          errorType: unconfigured
            ? "unconfigured"
            : value && !value.ok
              ? value.errorType ?? value.reason
              : "rejected",
        },
        unconfigured ? "info" : "error"
      );
    }

    if (emailResult.status === "fulfilled" && emailResult.value.ok) {
      logLead("email_send_success", {
        requestId,
        leadId: lead.leadId,
        durationMs: emailResult.value.durationMs,
      });
    } else {
      const value = emailResult.status === "fulfilled" ? emailResult.value : null;
      logLead(
        "email_send_failed",
        {
          requestId,
          leadId: lead.leadId,
          durationMs: value && !value.ok ? value.durationMs : undefined,
          errorType:
            value && !value.ok
              ? value.errorType ?? value.reason
              : "rejected",
        },
        value && !value.ok && value.reason === "unconfigured" ? "info" : "error"
      );
    }

    const telegramMessageId =
      telegramResult.status === "fulfilled" && telegramResult.value.ok
        ? telegramResult.value.messageId
        : undefined;

    if (!isLeadDelivered(telegram, email)) {
      cache.fail(input.submissionId);
      failGate(new Error("delivery_failed"));
      logLead(
        "lead_failed",
        {
          requestId,
          leadId: lead.leadId,
          errorType: "delivery_failed",
          telegram,
          email,
        },
        "error"
      );
      return {
        status: 503,
        body: { ok: false, error: "delivery_failed", requestId },
        telegramAttempted: telegram !== "not_configured",
      };
    }

    const body = successBody({
      leadId: lead.leadId,
      requestId,
      visitorDraft: formatVisitorDraft(lead),
      telegram,
      email,
    });

    cache.succeed(input.submissionId, body);
    settle(body);

    logLead("lead_completed", {
      requestId,
      leadId: lead.leadId,
      telegram,
      email,
      ...(telegramMessageId != null ? { telegramMessageId } : {}),
    });

    return {
      status: 200,
      body,
      telegramAttempted: telegram !== "not_configured",
      telegramMessageId,
    };
  } catch (error) {
    cache.fail(input.submissionId);
    failGate(error instanceof Error ? error : new Error("delivery_failed"));
    logLead(
      "lead_failed",
      {
        requestId,
        leadId: lead.leadId,
        errorType: "unhandled",
      },
      "error"
    );
    throw error;
  }
}
