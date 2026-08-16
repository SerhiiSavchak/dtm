import { z } from "zod";
import { normalizePhone } from "./phone";
import { parseArea } from "./parse-area";

export const objectTypeSchema = z.enum(["apartment", "house", "commercial"]);
export const renovationTypeSchema = z.enum(["cosmetic", "capital", "turnkey"]);
export const designSchema = z.enum(["yes", "no", "consult"]);
export const conditionSchema = z.enum([
  "newbuild",
  "secondary",
  "demolished",
  "other",
]);
export const startSchema = z.enum(["asap", "1-3", "3-6", "later"]);
export const localeSchema = z.enum(["uk", "en"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const utmSchema = z
  .object({
    source: optionalText(80),
    medium: optionalText(80),
    campaign: optionalText(120),
    content: optionalText(120),
    term: optionalText(120),
  })
  .optional();

export const leadInputSchema = z
  .object({
    objectType: objectTypeSchema,
    area: z.number().finite().gt(0),
    rooms: z.number().int().min(1).max(30).nullable(),
    renovationType: renovationTypeSchema,
    design: designSchema,
    condition: conditionSchema,
    start: startSchema,
    name: z.string().trim().min(1).max(80),
    phone: z.string().min(1).max(24),
    telegram: z
      .string()
      .trim()
      .max(64)
      .optional()
      .transform((value) => (value ? value : undefined)),
    locale: localeSchema,
    submissionId: z.uuid(),
    formStartedAt: z.number().int().positive(),
    honeypot: z.string().max(120).optional(),
    sourcePage: optionalText(500),
    utm: utmSchema,
  })
  .superRefine((value, ctx) => {
    const phone = normalizePhone(value.phone);
    if (!phone) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "invalid_phone",
      });
    }

    if (value.objectType === "commercial" && value.rooms != null) {
      ctx.addIssue({
        code: "custom",
        path: ["rooms"],
        message: "rooms_not_applicable",
      });
    }
  });

export type LeadInput = z.infer<typeof leadInputSchema>;

export function leadIdFromSubmission(submissionId: string): string {
  const compact = submissionId.replace(/-/g, "").toUpperCase();
  return `DTM-${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

export function sanitizePersonName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 80);
}

export function sanitizeTelegramHandle(raw: string): string | undefined {
  const trimmed = raw.trim().slice(0, 64);
  if (!trimmed) return undefined;
  return trimmed;
}

export { parseArea, normalizePhone };
