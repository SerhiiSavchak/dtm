import type { Project } from "@/data/projects";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { PortfolioRecord } from "@/lib/sanity/types";
import {
  categoryFromObjectType,
  isObjectType,
  type ObjectType,
} from "./object-type";

type DictionaryProjects = {
  objectTypes: Record<ObjectType, string>;
  facts: {
    objectType: string;
    location: string;
    rooms: string;
    area: string;
    workType: string;
    duration: string;
  };
  areaPlaceholder: string;
  location: { lviv: string };
};

function pickText(
  ua: string | null | undefined,
  en: string | null | undefined,
  locale: Locale
): string | undefined {
  const uk = ua?.trim() || undefined;
  const english = en?.trim() || undefined;
  if (locale === "en") return english ?? uk;
  return uk ?? english;
}

export function resolveObjectType(
  record: Pick<PortfolioRecord, "objectType" | "category">
): ObjectType | null {
  if (record.objectType && isObjectType(record.objectType)) {
    return record.objectType;
  }
  if (record.category === "house") return "private_house";
  if (record.category === "commercial") return "commercial";
  return null;
}

export function resolveCategory(
  record: Pick<PortfolioRecord, "objectType" | "category">
): Project["category"] {
  const objectType = resolveObjectType(record);
  if (objectType) return categoryFromObjectType(objectType);
  return record.category;
}

/** Ukrainian room count for card meta — 1 кімната / 2 кімнати / 5 кімнат */
export function ukRoomCardLabel(rooms: number): string {
  const n = Math.trunc(rooms);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} кімната`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} кімнати`;
  }
  return `${n} кімнат`;
}

export function enRoomCardLabel(rooms: number): string {
  const n = Math.trunc(rooms);
  return n === 1 ? "1 room" : `${n} rooms`;
}

/** Settlement/city context for street-based cards — not the street itself. */
export function cardContextHint(
  record: Pick<PortfolioRecord, "locationUa" | "locationEn">,
  locale: Locale
): string | null {
  const location = pickText(record.locationUa, record.locationEn, locale) || "";
  const village = location.match(/^с\.\s*(.+?)(?:,|$)/i);
  if (village) return village[1].trim();
  if (/^м\.\s*Львів/i.test(location)) {
    return locale === "en" ? "Lviv" : "Львів";
  }
  return null;
}

function normalizeCompare(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Omit dossier location when it repeats the display title (e.g. ЖК projects). */
export function locationDuplicatesTitle(
  title: string,
  location: string
): boolean {
  const t = normalizeCompare(title);
  const l = normalizeCompare(location);
  if (!t || !l) return false;
  if (t === l) return true;
  if (t.startsWith("жк ") && l.startsWith("жк ")) {
    const tCore = t.slice(3);
    const lCore = l.slice(3);
    if (tCore === lCore) return true;
    if (lCore.includes(tCore) || tCore.includes(lCore)) return true;
  }
  return false;
}

export function portfolioCardLabels(
  record: PortfolioRecord,
  locale: Locale,
  dict: DictionaryProjects
) {
  const objectType = resolveObjectType(record);
  const objectLabel = objectType ? dict.objectTypes[objectType] : null;
  const category = resolveCategory(record);
  const title = pickText(record.titleUa, record.titleEn, locale) ?? record.titleUa;

  let meta: string | null = null;
  if (category === "apartment" && record.rooms && objectLabel) {
    const roomLabel =
      locale === "en"
        ? enRoomCardLabel(record.rooms)
        : ukRoomCardLabel(record.rooms);
    meta = `${objectLabel} · ${roomLabel}`;
  } else if (objectLabel) {
    const context = cardContextHint(record, locale);
    meta = context ? `${objectLabel} · ${context}` : objectLabel;
  }

  return {
    title,
    meta,
    area: record.area?.trim() || null,
  };
}

export function dossierFacts(
  project: Project,
  dict: DictionaryProjects
): { label: string; value: string; wide?: boolean }[] {
  const facts: { label: string; value: string; wide?: boolean }[] = [];

  if (project.objectType && dict.objectTypes[project.objectType]) {
    facts.push({
      label: dict.facts.objectType,
      value: dict.objectTypes[project.objectType],
    });
  }

  const location =
    project.location?.trim() ||
    (project.locationKey ? dict.location[project.locationKey] : null);
  if (location && !locationDuplicatesTitle(project.title, location)) {
    facts.push({ label: dict.facts.location, value: location });
  }

  if (project.rooms && project.category === "apartment") {
    facts.push({
      label: dict.facts.rooms,
      value: String(project.rooms),
    });
  }

  if (project.area) {
    facts.push({
      label: dict.facts.area,
      value: project.area.startsWith("[")
        ? dict.areaPlaceholder
        : project.area,
    });
  }

  if (project.workType) {
    facts.push({
      label: dict.facts.workType,
      value: project.workType,
      wide: project.workType.length > 36,
    });
  }

  if (project.duration) {
    facts.push({
      label: dict.facts.duration,
      value: project.duration,
    });
  }

  return facts;
}
