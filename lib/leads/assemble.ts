import type { EstimateFormState } from "@/lib/calculator/types";
import { parseArea } from "./parse-area";
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
  const area = parseArea(args.state.area);
  const roomsRaw = args.state.rooms.trim();
  const rooms =
    args.state.objectType === "commercial" || !roomsRaw
      ? null
      : Number(roomsRaw);

  const payload: Record<string, unknown> = {
    objectType: args.state.objectType,
    area: area.ok ? area.value : args.state.area,
    rooms: Number.isInteger(rooms) ? rooms : null,
    renovationType: args.state.renovationType,
    design: args.state.design,
    condition: args.state.condition,
    start: args.state.start,
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
