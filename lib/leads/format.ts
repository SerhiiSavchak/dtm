import {
  estimateStateFromOwnerSource,
  formatCalculatorSummary,
  ownerSummaryCopy,
} from "@/lib/calculator/answers";
import type { EstimateFormState } from "@/lib/calculator/types";
import {
  conditionLabels,
  designLabels,
  objectTypeLabels,
  renovationTypeLabels,
  startLabels,
} from "./labels";
import { parseArea } from "./parse-area";
import { normalizePhone } from "./phone";
import {
  leadIdFromSubmission,
  sanitizePersonName,
  sanitizeTelegramHandle,
  type LeadInput,
} from "./schema";
import type { UtmFields } from "./utm";

export type CanonicalLead = {
  leadId: string;
  submissionId: string;
  submittedAt: string;
  name: string;
  phone: string;
  objectType: LeadInput["objectType"];
  objectTypeLabel: string;
  area: number;
  renovationType: LeadInput["renovationType"];
  renovationTypeLabel: string;
  design: LeadInput["design"];
  designLabel: string;
  condition: LeadInput["condition"];
  conditionLabel: string;
  start: LeadInput["start"];
  startLabel: string;
  locale: LeadInput["locale"];
  rooms?: number;
  telegram?: string;
  sourcePage?: string;
  utm?: UtmFields;
};

const KYIV_TZ = "Europe/Kyiv";

export function formatKyivDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: KYIV_TZ,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function compactUtm(utm: LeadInput["utm"]): UtmFields | undefined {
  if (!utm) return undefined;
  const next: UtmFields = {};
  if (utm.source) next.source = utm.source;
  if (utm.medium) next.medium = utm.medium;
  if (utm.campaign) next.campaign = utm.campaign;
  if (utm.content) next.content = utm.content;
  if (utm.term) next.term = utm.term;
  return Object.keys(next).length ? next : undefined;
}

export function toCanonicalLead(input: LeadInput, submittedAt = new Date()): CanonicalLead {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    throw new Error("invalid_phone");
  }

  const lead: CanonicalLead = {
    leadId: leadIdFromSubmission(input.submissionId),
    submissionId: input.submissionId,
    submittedAt: submittedAt.toISOString(),
    name: sanitizePersonName(input.name),
    phone,
    objectType: input.objectType,
    objectTypeLabel: objectTypeLabels[input.objectType],
    area: input.area,
    renovationType: input.renovationType,
    renovationTypeLabel: renovationTypeLabels[input.renovationType],
    design: input.design,
    designLabel: designLabels[input.design],
    condition: input.condition,
    conditionLabel: conditionLabels[input.condition],
    start: input.start,
    startLabel: startLabels[input.start],
    locale: input.locale,
  };

  if (input.rooms != null) lead.rooms = input.rooms;
  const telegram = input.telegram ? sanitizeTelegramHandle(input.telegram) : undefined;
  if (telegram) lead.telegram = telegram;
  if (input.sourcePage) lead.sourcePage = input.sourcePage;
  const utm = compactUtm(input.utm);
  if (utm) lead.utm = utm;

  return lead;
}

function limitText(value: string, max = 3500): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function parameterItemsFromLead(lead: CanonicalLead) {
  return formatCalculatorSummary(
    estimateStateFromOwnerSource(lead),
    "lead",
    ownerSummaryCopy()
  );
}

export function formatOwnerTelegram(lead: CanonicalLead): string {
  const parameters = parameterItemsFromLead(lead);
  const lines = [
    "🏠 Нова заявка з сайту DTM",
    "",
    `Номер заявки: ${lead.leadId}`,
    `Дата: ${formatKyivDateTime(lead.submittedAt)} (Київ)`,
    `Ім’я: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    "",
    ...parameters.map((item) => item.text),
  ];

  if (lead.telegram) lines.push(`Telegram відвідувача: ${lead.telegram}`);
  if (lead.sourcePage) lines.push(`Сторінка: ${lead.sourcePage}`);

  if (lead.utm) {
    const parts = [
      lead.utm.source && `source=${lead.utm.source}`,
      lead.utm.medium && `medium=${lead.utm.medium}`,
      lead.utm.campaign && `campaign=${lead.utm.campaign}`,
      lead.utm.content && `content=${lead.utm.content}`,
      lead.utm.term && `term=${lead.utm.term}`,
    ].filter(Boolean);
    if (parts.length) lines.push(`UTM: ${parts.join(" · ")}`);
  }

  return limitText(lines.join("\n"));
}

export function formatVisitorDraft(lead: CanonicalLead): string {
  const parameters = parameterItemsFromLead(lead);
  const lines = [
    "Вітаю! Я щойно заповнив(ла) форму на сайті DTM.",
    "",
    `Номер заявки: ${lead.leadId}`,
    `Ім’я: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    ...parameters.map((item) => item.text),
  ];

  if (lead.telegram) lines.push(`Мій Telegram: ${lead.telegram}`);
  lines.push("", "Хочу уточнити деталі щодо ремонту.");

  return limitText(lines.join("\n"), 3500);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string): string {
  return `<tr><th align="left" style="padding:6px 16px 6px 0;color:#6b6b68;font-weight:500;vertical-align:top;">${escapeHtml(label)}</th><td style="padding:6px 0;color:#141416;">${value}</td></tr>`;
}

export function formatOwnerEmail(lead: CanonicalLead): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `DTM — Нова заявка · ${lead.leadId}`;
  const text = formatOwnerTelegram(lead).replace("🏠 ", "");

  const telHref = `tel:${escapeHtml(lead.phone)}`;
  const phoneHtml = `<a href="${telHref}" style="color:#141416;text-decoration:none;">${escapeHtml(lead.phone)}</a>`;

  const rows = [
    row("Номер заявки", escapeHtml(lead.leadId)),
    row("Дата (Київ)", escapeHtml(formatKyivDateTime(lead.submittedAt))),
    row("Ім’я", escapeHtml(lead.name)),
    row("Телефон", phoneHtml),
    ...parameterItemsFromLead(lead).map((item) =>
      row(item.label, escapeHtml(item.value))
    ),
  ];
  if (lead.telegram) rows.push(row("Telegram відвідувача", escapeHtml(lead.telegram)));

  const metaRows: string[] = [];
  if (lead.sourcePage) metaRows.push(row("Сторінка", escapeHtml(lead.sourcePage)));
  if (lead.utm?.source) metaRows.push(row("UTM source", escapeHtml(lead.utm.source)));
  if (lead.utm?.medium) metaRows.push(row("UTM medium", escapeHtml(lead.utm.medium)));
  if (lead.utm?.campaign) metaRows.push(row("UTM campaign", escapeHtml(lead.utm.campaign)));
  if (lead.utm?.content) metaRows.push(row("UTM content", escapeHtml(lead.utm.content)));
  if (lead.utm?.term) metaRows.push(row("UTM term", escapeHtml(lead.utm.term)));

  const html = `<!DOCTYPE html>
<html lang="uk">
<body style="margin:0;padding:24px;background:#f4f4f1;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;padding:28px 32px;">
    <tr><td>
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#f26a1f;">DTM</p>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:600;color:#141416;">Нова заявка з сайту</h1>
      <table cellpadding="0" cellspacing="0">${rows.join("")}</table>
      ${
        metaRows.length
          ? `<h2 style="margin:28px 0 12px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#6b6b68;">Джерело</h2><table cellpadding="0" cellspacing="0">${metaRows.join("")}</table>`
          : ""
      }
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

export type StepErrorKey =
  | "required"
  | "areaEmpty"
  | "areaZero"
  | "areaDigits"
  | "name"
  | "phoneEmpty"
  | "phoneInvalid";

export function validateStep(
  stepId: string,
  state: EstimateFormState
): { ok: true } | { ok: false; key: StepErrorKey; field?: string } {
  switch (stepId) {
    case "objectType":
      return state.objectType ? { ok: true } : { ok: false, key: "required" };
    case "area": {
      const parsed = parseArea(state.area);
      if (!parsed.ok) {
        const key =
          parsed.reason === "empty"
            ? "areaEmpty"
            : parsed.reason === "zero"
              ? "areaZero"
              : "areaDigits";
        return { ok: false, key, field: "area" };
      }
      return { ok: true };
    }
    case "rooms":
      if (!state.rooms) return { ok: true };
      {
        const rooms = Number(state.rooms);
        if (!Number.isInteger(rooms) || rooms < 1 || rooms > 30) {
          return { ok: false, key: "required" };
        }
      }
      return { ok: true };
    case "renovationType":
      return state.renovationType ? { ok: true } : { ok: false, key: "required" };
    case "design":
      return state.design ? { ok: true } : { ok: false, key: "required" };
    case "condition":
      return state.condition ? { ok: true } : { ok: false, key: "required" };
    case "start":
      return state.start ? { ok: true } : { ok: false, key: "required" };
    case "lead": {
      if (!sanitizePersonName(state.name)) {
        return { ok: false, key: "name", field: "name" };
      }
      if (!state.phone.trim()) {
        return { ok: false, key: "phoneEmpty", field: "phone" };
      }
      if (!normalizePhone(state.phone)) {
        return { ok: false, key: "phoneInvalid", field: "phone" };
      }
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}
