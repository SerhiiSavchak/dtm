import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

export const project = defineType({
  name: "project",
  title: "Наші роботи",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "project", hidden: true }),
    defineField({
      name: "titleUa",
      title: "Назва — українською",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "titleEn",
      title: "Назва — English",
      type: "string",
    }),
    defineField({
      name: "slug",
      title: "Адреса в системі",
      type: "slug",
      options: {
        source: "titleUa",
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Категорія",
      type: "string",
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
      name: "locationKey",
      title: "Місто",
      type: "string",
      options: {
        list: [{ title: "Львів", value: "lviv" }],
      },
      initialValue: "lviv",
    }),
    defineField({
      name: "descriptionUa",
      title: "Опис — українською",
      type: "array",
      of: [{ type: "text", title: "Абзац", rows: 3 }],
    }),
    defineField({
      name: "descriptionEn",
      title: "Опис — English",
      type: "array",
      of: [{ type: "text", title: "Paragraph", rows: 3 }],
    }),
    defineField({
      name: "area",
      title: "Площа",
      type: "string",
      description: "Як на сайті, наприклад 72 м².",
    }),
    defineField({
      name: "workTypeUa",
      title: "Тип робіт — українською",
      type: "string",
    }),
    defineField({
      name: "workTypeEn",
      title: "Тип робіт — English",
      type: "string",
    }),
    defineField({
      name: "durationUa",
      title: "Термін виконання — українською",
      type: "string",
    }),
    defineField({
      name: "durationEn",
      title: "Термін виконання — English",
      type: "string",
    }),
    defineField({
      name: "year",
      title: "Рік",
      type: "string",
    }),
    defineField({
      name: "cover",
      title: "Обкладинка",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "coverPosition",
      title: "Позиція обкладинки",
      type: "string",
      fieldset: "advanced",
      initialValue: "center center",
      description:
        "CSS object-position для картки. Залиште center center, якщо не впевнені.",
    }),
    defineField({
      name: "span",
      title: "Розмір картки",
      type: "string",
      options: {
        list: [
          { title: "Велика (перша / акцентна)", value: "large" },
          { title: "Висока", value: "tall" },
          { title: "Широка", value: "wide" },
          { title: "Компактна", value: "small" },
        ],
      },
      initialValue: "large",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Галерея",
      type: "array",
      of: [{ type: "projectMedia" }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  fieldsets: [
    {
      name: "advanced",
      title: "Додатково",
      options: { collapsible: true, collapsed: true },
    },
  ],
  preview: {
    select: {
      title: "titleUa",
      category: "category",
      area: "area",
      media: "cover",
    },
    prepare({ title, category, area, media }) {
      const categoryLabel =
        category === "house"
          ? "Будинок"
          : category === "commercial"
            ? "Комерційне"
            : "Квартира";
      return {
        title: title || "Без назви",
        subtitle: [categoryLabel, area].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
