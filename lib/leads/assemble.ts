import { answersForPayload } from "@/lib/calculator/answers";
import type { EstimateFormState } from "@/lib/calculator/types";
import { sanitizePersonName, sanitizeTelegramHandle } from "./schema";
import type { UtmFields } from "./utm";

export function assembleLeadRequest(args: {
  state: EstimateFormState;
  locale: "uk" | "en";
  submissionId: string;
  formStartedAt: number;
  honeypot: string;
  sourcePage?: string;
  utm?: UtmFields;
}) {
  const answers = answersForPayload(args.state);

  const payload: Record<string, unknown> = {
    objectType: answers.objectType,
    area: answers.area,
    rooms: answers.rooms,
    renovationType: answers.renovationType,
    design: answers.design,
    condition: answers.condition,
    start: answers.start,
    name: sanitizePersonName(args.state.name),
    phone: args.state.phone.trim(),
    locale: args.locale,
    submissionId: args.submissionId,
    formStartedAt: args.formStartedAt,
  };

  const telegram = sanitizeTelegramHandle(args.state.telegram);
  if (telegram) payload.telegram = telegram;
  if (args.honeypot) payload.honeypot = args.honeypot;
  if (args.sourcePage) payload.sourcePage = args.sourcePage;
  if (args.utm) payload.utm = args.utm;

  return payload;
}
