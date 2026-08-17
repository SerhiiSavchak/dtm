export type ProjectCategory = "apartment" | "house" | "commercial";

export type ProjectMediaFit = "cover" | "contain";

export type ProjectMedia = {
  src: string;
  video?: string | null;
  /** Stage object-fit. Portrait/detail stills use contain; landscape/hero may cover. */
  fit: ProjectMediaFit;
  objectPosition: string;
  /** Filmstrip crop; falls back to objectPosition. */
  thumbPosition?: string;
};

export type Project = {
  slug: string;
  title: string;
  isPlaceholder?: boolean;
  category: ProjectCategory;
  locationKey?: "lviv";
  description?: string | string[];
  area?: string;
  workType?: string;
  duration?: string;
  year?: string;
  type?: string;
  cover: string;
  coverPosition: string;
  media: ProjectMedia[];
  span: "large" | "tall" | "wide" | "small";
};

function portraitStill(
  src: string,
  thumbPosition: string
): ProjectMedia {
  return {
    src,
    fit: "contain",
    objectPosition: "center center",
    thumbPosition,
  };
}

function landscapeStill(
  src: string,
  thumbPosition: string
): ProjectMedia {
  return {
    src,
    fit: "contain",
    objectPosition: "center center",
    thumbPosition,
  };
}

/**
 * Portfolio — supplied DTM photographs only.
 *
 * Visual grouping (filenames are not identities). Adjacent covers must look
 * distinct; same physical site may appear as more than one item when rooms
 * read as different stills.
 *
 * - interior-living: beige handleless kitchen, black stone worktop,
 *   sculptural S-wall light, round dining table.
 * - interior-stone: gold/brass hardware, viola marble, chevron parquet,
 *   freestanding tub.
 *
 * PNG stock/render covers (project-01…04, hero.png) are not DTM work
 * and must not appear here.
 *
 * Telegram stills are portrait (~9:16). Stage uses contain so they are not
 * cropped into unusable landscape fragments; filmstrip uses cover + thumbPosition.
 *
 * First-project media[] is owned by the image-quality pipeline — do not replace
 * those source paths from this file’s portfolio expansion.
 */
export const projects: Project[] = [
  {
    slug: "interior-living",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Кухня-вітальня",
    isPlaceholder: true,
    category: "apartment",
    locationKey: "lviv",
    type: "Квартира",
    area: "72 м²",
    workType: "Під ключ",
    duration: "4 місяці",
    year: "2025",
    description:
      "Відкритий простір: кухня без ручок, чорна стільниця, обідній стіл і зона з диваном.",
    cover: "/images/photo_2026-08-09_15-10-55.jpg",
    // 4/5 card: keep the S-sconce in frame. 62% was for a 16:10 sofa crop.
    coverPosition: "center 40%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-10-55.jpg", "center 40%"),
      portraitStill("/images/photo_2026-08-09_15-11-17.jpg", "center 48%"),
      landscapeStill("/images/photo_2026-08-09_15-11-14.jpg", "center 46%"),
      portraitStill("/images/photo_2026-08-09_15-11-12.jpg", "center 50%"),
      portraitStill("/images/photo_2026-08-09_15-10-59.jpg", "center 46%"),
    ],
    span: "large",
  },
  {
    slug: "interior-stone",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Камінь і латунь",
    isPlaceholder: true,
    category: "apartment",
    locationKey: "lviv",
    type: "Квартира",
    area: "86 м²",
    workType: "Чорнові та чистові",
    duration: "5 місяців",
    year: "2024",
    description:
      "Мармур, шевронний паркет і латунна фурнітура в санвузлі та проходах.",
    cover: "/images/photo_2026-08-09_15-10-13.jpg",
    coverPosition: "center 58%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-10-13.jpg", "center 58%"),
      portraitStill("/images/photo_2026-08-09_15-10-16.jpg", "center 52%"),
      portraitStill("/images/photo_2026-08-09_15-10-41.jpg", "center 40%"),
      portraitStill("/images/photo_2026-08-09_15-10-36.jpg", "center 48%"),
      portraitStill("/images/photo_2026-08-09_15-10-43.jpg", "center 44%"),
      portraitStill("/images/photo_2026-08-09_15-10-19.jpg", "center 50%"),
    ],
    span: "tall",
  },
  {
    slug: "hidden-doors",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Коридор з прихованими дверима",
    isPlaceholder: true,
    category: "apartment",
    locationKey: "lviv",
    type: "Квартира",
    area: "64 м²",
    workType: "Чистове оздоблення",
    duration: "3 місяці",
    year: "2025",
    description:
      "Фактурна штукатурка, полотна в рівень зі стіною, великоформатна плитка.",
    cover: "/images/photo_2026-08-09_15-11-53.jpg",
    coverPosition: "center 46%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-11-53.jpg", "center 46%"),
      portraitStill("/images/photo_2026-08-09_15-11-30.jpg", "center 48%"),
      portraitStill("/images/photo_2026-08-09_15-11-33.jpg", "center 52%"),
      portraitStill("/images/photo_2026-08-09_15-11-23.jpg", "center 44%"),
    ],
    span: "wide",
  },
  {
    slug: "oak-kitchen",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Кухня з дубовими фасадами",
    isPlaceholder: true,
    category: "apartment",
    locationKey: "lviv",
    type: "Квартира",
    area: "78 м²",
    workType: "Під ключ",
    duration: "4,5 місяця",
    year: "2025",
    description:
      "Нижній ряд з дерева, мармурова стільниця, обідній стіл у тому ж камені.",
    cover: "/images/photo_2026-08-09_15-11-51.jpg",
    coverPosition: "center 42%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-11-51.jpg", "center 42%"),
      portraitStill("/images/photo_2026-08-09_15-11-49.jpg", "center 48%"),
      portraitStill("/images/photo_2026-08-09_15-11-39.jpg", "center 40%"),
      portraitStill("/images/photo_2026-08-09_15-11-41.jpg", "center 38%"),
      portraitStill("/images/photo_2026-08-09_15-11-36.jpg", "center 44%"),
    ],
    span: "small",
  },
  {
    slug: "house-bedroom",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Спальня з робочим місцем",
    isPlaceholder: true,
    category: "house",
    locationKey: "lviv",
    type: "Будинок",
    area: "168 м²",
    workType: "Чистове оздоблення",
    duration: "6 місяців",
    year: "2024",
    description:
      "М’яке узголів’я, підсвітлена стіна, стіл біля вікна, шафа з дзеркалом.",
    cover: "/images/photo_2026-08-09_15-12-03.jpg",
    coverPosition: "center 40%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-12-03.jpg", "center 40%"),
      portraitStill("/images/photo_2026-08-09_15-12-22.jpg", "center 42%"),
    ],
    span: "large",
  },
  {
    slug: "marble-vanity",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Умивальник зі смуг мармуру",
    isPlaceholder: true,
    category: "apartment",
    locationKey: "lviv",
    type: "Квартира",
    area: "81 м²",
    workType: "Чистове оздоблення",
    duration: "3,5 місяця",
    year: "2024",
    description:
      "Набірний камінь на тумбі, латунний змішувач, ніша з полицями.",
    cover: "/images/photo_2026-08-09_15-10-51.jpg",
    coverPosition: "center 48%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-10-51.jpg", "center 48%"),
      portraitStill("/images/photo_2026-08-09_15-10-49.jpg", "center 46%"),
      portraitStill("/images/photo_2026-08-09_15-10-09.jpg", "center 44%"),
    ],
    span: "tall",
  },
  {
    slug: "house-living",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Ніша з диваном",
    isPlaceholder: true,
    category: "house",
    locationKey: "lviv",
    type: "Будинок",
    area: "154 м²",
    workType: "Під ключ",
    duration: "5,5 місяця",
    year: "2025",
    description:
      "Диван у шафах, дерев’яна панель, зона ТБ і санвузол з дерев’яною тумбою.",
    cover: "/images/photo_2026-08-09_15-12-25.jpg",
    coverPosition: "center 48%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-12-25.jpg", "center 48%"),
      portraitStill("/images/photo_2026-08-09_15-11-27.jpg", "center 42%"),
      portraitStill("/images/photo_2026-08-09_15-12-28.jpg", "center 40%"),
      portraitStill("/images/photo_2026-08-09_15-12-20.jpg", "center 46%"),
    ],
    span: "wide",
  },
  {
    slug: "millwork-brass",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Двері та столярка",
    isPlaceholder: true,
    category: "apartment",
    locationKey: "lviv",
    type: "Квартира",
    area: "74 м²",
    workType: "Столярка та двері",
    duration: "2,5 місяця",
    year: "2024",
    description:
      "Приховані полотна з латунною кромкою, шафи без ручок, шеврон до виходу.",
    cover: "/images/photo_2026-08-09_15-10-27.jpg",
    coverPosition: "center 50%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-10-27.jpg", "center 50%"),
      portraitStill("/images/photo_2026-08-09_15-10-22.jpg", "center 46%"),
      portraitStill("/images/photo_2026-08-09_15-10-38.jpg", "center 44%"),
      portraitStill("/images/photo_2026-08-09_15-10-32.jpg", "center 48%"),
      portraitStill("/images/photo_2026-08-09_15-10-25.jpg", "center 70%"),
    ],
    span: "small",
  },
  {
    slug: "marble-desk",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Кабінет",
    isPlaceholder: true,
    category: "commercial",
    locationKey: "lviv",
    type: "Комерційне приміщення",
    area: "36 м²",
    workType: "Чистове оздоблення",
    duration: "2 місяці",
    year: "2025",
    description: "Мармуровий стіл, графіка на стіні, трекове світло.",
    cover: "/images/photo_2026-08-09_15-10-06.jpg",
    coverPosition: "center 55%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-10-06.jpg", "center 55%"),
    ],
    span: "large",
  },
  {
    slug: "atrium-lights",
    // TEMPORARY PLACEHOLDER DATA — replace with verified DTM project information
    title: "Сходова зона",
    isPlaceholder: true,
    category: "house",
    locationKey: "lviv",
    type: "Будинок",
    area: "142 м²",
    workType: "Чистове оздоблення",
    duration: "4 місяці",
    year: "2023",
    description: "Камінь на стінах, підвіси з кулями, скляне огородження.",
    cover: "/images/photo_2026-08-09_15-10-34.jpg",
    coverPosition: "center 36%",
    media: [
      portraitStill("/images/photo_2026-08-09_15-10-34.jpg", "center 36%"),
    ],
    span: "tall",
  },
];

export function projectMedia(project: Project): ProjectMedia[] {
  if (project.media.length > 0) return project.media;
  return [
    {
      src: project.cover,
      fit: "cover",
      objectPosition: project.coverPosition,
    },
  ];
}
