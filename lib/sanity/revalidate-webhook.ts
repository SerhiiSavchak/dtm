import {
  IN_PROGRESS_DOCUMENT_TYPES,
  PORTFOLIO_DOCUMENT_TYPES,
  SANITY_CACHE_TAGS,
  type SanityCacheTag,
} from "./cache-tags";
import { timingSafeEqual } from "node:crypto";

export type RevalidationResolution =
  | { status: "ok"; tags: SanityCacheTag[]; types: string[] }
  | { status: "ignored"; reason: string }
  | { status: "rejected"; reason: "dataset_missing" | "dataset_mismatch" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addType(types: Set<string>, value: unknown) {
  if (typeof value === "string" && value.length > 0) types.add(value);
}

/** Collect Sanity document `_type` values from common webhook payload shapes. */
export function collectDocumentTypes(body: unknown): string[] {
  const types = new Set<string>();
  if (!isRecord(body)) return [];

  addType(types, body._type);

  if (Array.isArray(body.result)) {
    for (const item of body.result) {
      if (isRecord(item)) addType(types, item._type);
    }
  } else if (isRecord(body.result)) {
    addType(types, body.result._type);
  }

  if (isRecord(body.body)) {
    for (const nested of collectDocumentTypes(body.body)) types.add(nested);
  }

  if (Array.isArray(body.documents)) {
    for (const doc of body.documents) {
      for (const nested of collectDocumentTypes(doc)) types.add(nested);
    }
  }

  return [...types];
}

export function extractDataset(body: unknown): string | null {
  if (!isRecord(body)) return null;
  return typeof body.dataset === "string" ? body.dataset : null;
}

export function tagsForDocumentTypes(types: readonly string[]): SanityCacheTag[] {
  const tags = new Set<SanityCacheTag>();
  for (const type of types) {
    if (PORTFOLIO_DOCUMENT_TYPES.has(type)) tags.add(SANITY_CACHE_TAGS.portfolio);
    if (IN_PROGRESS_DOCUMENT_TYPES.has(type)) tags.add(SANITY_CACHE_TAGS.inProgress);
  }
  return [...tags];
}

/**
 * Dataset identity is required. A development webhook must never invalidate
 * a production deployment (and vice versa).
 */
export function resolveRevalidation(
  body: unknown,
  expectedDataset: string
): RevalidationResolution {
  const dataset = extractDataset(body);
  if (!dataset) {
    return { status: "rejected", reason: "dataset_missing" };
  }
  if (dataset !== expectedDataset) {
    return { status: "rejected", reason: "dataset_mismatch" };
  }

  const types = collectDocumentTypes(body);
  if (types.length === 0) {
    return { status: "ignored", reason: "no_document_types" };
  }

  const tags = tagsForDocumentTypes(types);
  if (tags.length === 0) {
    return { status: "ignored", reason: "irrelevant_document_types" };
  }

  return { status: "ok", tags, types };
}

export function readProvidedSecret(request: Request): string | null {
  const header = request.headers.get("x-dtm-revalidate-secret");
  if (header) return header.trim();

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();

  return null;
}

export function secretsMatch(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
