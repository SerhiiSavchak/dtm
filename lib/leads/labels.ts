import type {
  Condition,
  DesignStatus,
  ObjectType,
  RenovationType,
  StartWindow,
} from "@/lib/calculator/types";

export const objectTypeLabels: Record<ObjectType, string> = {
  apartment: "Квартира",
  house: "Будинок",
  commercial: "Комерційне приміщення",
};

export const renovationTypeLabels: Record<RenovationType, string> = {
  cosmetic: "Косметичний",
  capital: "Капітальний",
  turnkey: "Під ключ",
};

export const designLabels: Record<DesignStatus, string> = {
  yes: "Є",
  no: "Немає",
  consult: "Потрібна консультація",
};

export const conditionLabels: Record<Condition, string> = {
  newbuild: "Новобудова",
  secondary: "Вторинне житло",
  demolished: "Після демонтажу",
  other: "Інше",
};

export const startLabels: Record<StartWindow, string> = {
  asap: "Якнайшвидше",
  "1-3": "1–3 місяці",
  "3-6": "3–6 місяців",
  later: "Пізніше",
};

export const PUBLIC_TELEGRAM_USERNAME = "xrayboy";
export const PUBLIC_TELEGRAM_URL = `https://t.me/${PUBLIC_TELEGRAM_USERNAME}`;
export const PUBLIC_INSTAGRAM_URL =
  "https://www.instagram.com/dtm_remont_lviv/";
