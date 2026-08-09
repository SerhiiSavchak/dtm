export type Project = {
  id: string;
  title: string;
  category: string;
  location: string;
  area: string;
  image: string;
  /** relative visual weight in the editorial grid */
  span: "large" | "tall" | "wide" | "small";
};

/**
 * Placeholder portfolio metadata — swap `title`, `image`, `area` etc. for real
 * DTM project data when available. Категорії відповідають майбутнім розділам
 * портфоліо: Квартири, Будинки, Комерція, Готелі.
 */
export const projects: Project[] = [
  {
    id: "01",
    title: "ЖК [placeholder]",
    category: "Квартира",
    location: "Львів",
    area: "92 м²",
    image: "/images/project-01.png",
    span: "large",
  },
  {
    id: "02",
    title: "Приватний будинок",
    category: "Будинок",
    location: "Львів",
    area: "180 м²",
    image: "/images/project-02.png",
    span: "tall",
  },
  {
    id: "03",
    title: "Санвузол [placeholder]",
    category: "Квартира",
    location: "Львів",
    area: "16 м²",
    image: "/images/project-03.png",
    span: "small",
  },
  {
    id: "04",
    title: "Комерційний простір",
    category: "Комерція",
    location: "Львів",
    area: "240 м²",
    image: "/images/project-04.png",
    span: "wide",
  },
];

export type Service = {
  index: string;
  title: string;
  description: string;
};

export const services: Service[] = [
  {
    index: "01",
    title: "Ремонт квартир під ключ",
    description:
      "Повний цикл — від демонтажу та чорнових робіт до фінішного оздоблення й меблювання.",
  },
  {
    index: "02",
    title: "Ремонт будинків",
    description:
      "Комплексні роботи в приватних будинках з урахуванням інженерії та планування.",
  },
  {
    index: "03",
    title: "Комерційні приміщення",
    description:
      "Офіси, заклади та торгові простори — ремонт з дотриманням термінів і бюджету.",
  },
  {
    index: "04",
    title: "Дизайн інтер’єру",
    description:
      "Проєктування простору, підбір матеріалів та авторський нагляд на всіх етапах.",
  },
];

/** What DTM takes responsibility for — the trust transition. */
export const responsibilities: string[] = [
  "Кошторис",
  "Організація робіт",
  "Прораб",
  "Закупівля та комплектація",
  "Контроль виконання",
];

export const nav = [
  { label: "Послуги", href: "#services" },
  { label: "Наші роботи", href: "#projects" },
  { label: "Про DTM", href: "#about" },
  { label: "Контакти", href: "#contacts" },
];
