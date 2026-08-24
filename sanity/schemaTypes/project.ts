import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";
import { projectListPreview } from "../lib/previews";
import { slugifyUa, uniqueDraftSlug } from "../lib/slugify";

export const project = defineType({
  name: "project",
  title: "Робота",
  type: "document",
  orderings: [orderRankOrdering],
  groups: [
    { name: "main", title: "Основне", default: true },
    { name: "photos", title: "Фото" },
    { name: "details", title: "Деталі" },
    { name: "english", title: "Англійська версія" },
    { name: "advanced", title: "Додаткові налаштування" },
  ],
  initialValue: () => ({
    locationKey: "lviv",
    span: "small",
    coverPosition: "center center",
    slug: { _type: "slug", current: uniqueDraftSlug("proekt") },
  }),
  fields: [
    orderRankField({ type: "project", hidden: true }),
    defineField({
      name: "titleUa",
      title: "Назва",
      type: "string",
      group: "main",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Тип об’єкта",
      type: "string",
      group: "main",
      options: {
        list: [
          { title: "Квартира", value: "apartment" },
          { title: "Будинок", value: "house" },
          { title: "Комерційне приміщення", value: "commercial" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "area",
      title: "Площа",
      type: "string",
      group: "main",
      description: "Як на сайті, наприклад 72 м².",
    }),
    defineField({
      name: "descriptionUa",
      title: "Опис",
      type: "array",
      group: "main",
      of: [{ type: "text", title: "Абзац", rows: 3 }],
    }),
    defineField({
      name: "cover",
      title: "Обкладинка",
      type: "image",
      group: "photos",
      options: { hotspot: true },
      description: "Фото у списку робіт на головній.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Галерея",
      type: "array",
      group: "photos",
      of: [{ type: "projectMedia" }],
      options: { sortable: true },
      description:
        "Додайте кілька фото. Порядок у списку — порядок у вікні проєкту. Перетягніть, щоб змінити. Перше фото відкривається першим.",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "workTypeUa",
      title: "Тип робіт",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "durationUa",
      title: "Термін виконання",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "year",
      title: "Рік",
      type: "string",
      group: "details",
    }),
    defineField({
      name: "titleEn",
      title: "Назва",
      type: "string",
      group: "english",
      description:
        "Необов’язково. Якщо порожньо, англійською покажеться українська назва.",
    }),
    defineField({
      name: "descriptionEn",
      title: "Опис",
      type: "array",
      group: "english",
      of: [{ type: "text", title: "Paragraph", rows: 3 }],
    }),
    defineField({
      name: "workTypeEn",
      title: "Тип робіт",
      type: "string",
      group: "english",
    }),
    defineField({
      name: "durationEn",
      title: "Термін виконання",
      type: "string",
      group: "english",
    }),
    defineField({
      name: "locationKey",
      title: "Місто",
      type: "string",
      group: "advanced",
      hidden: true,
      initialValue: "lviv",
      options: {
        list: [{ title: "Львів", value: "lviv" }],
      },
    }),
    defineField({
      name: "slug",
      title: "Системна адреса",
      type: "slug",
      group: "advanced",
      hidden: true,
      readOnly: true,
      description: "Створюється автоматично. Не змінюється при перейменуванні роботи.",
      options: {
        source: "titleUa",
        maxLength: 96,
        slugify: (input) => slugifyUa(input) || uniqueDraftSlug("proekt"),
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "span",
      title: "Розмір картки",
      type: "string",
      group: "advanced",
      description:
        "Звичайна композиція на сайті задається автоматично за порядком робіт. Це поле залиште без змін, якщо немає окремої вказівки.",
      options: {
        list: [
          { title: "Велика", value: "large" },
          { title: "Вертикальна", value: "tall" },
          { title: "Широка", value: "wide" },
          { title: "Мала", value: "small" },
        ],
      },
      initialValue: "small",
      validation: (Rule) =>
        Rule.required().custom((value) =>
          value === "large" ||
          value === "tall" ||
          value === "wide" ||
          value === "small"
            ? true
            : "Оберіть один із запропонованих розмірів"
        ),
    }),
    defineField({
      name: "coverPosition",
      title: "Позиція фото",
      type: "string",
      group: "advanced",
      initialValue: "center center",
      description:
        "Лише якщо важлива частина обкладинки обрізається неправильно. Наприклад: center 40%.",
    }),
  ],
  preview: {
    select: {
      title: "titleUa",
      category: "category",
      area: "area",
      media: "cover",
    },
    prepare: projectListPreview,
  },
});
