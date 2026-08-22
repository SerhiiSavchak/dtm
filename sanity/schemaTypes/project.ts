import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";
import { slugifyUa, uniqueDraftSlug } from "../lib/slugify";

export const project = defineType({
  name: "project",
  title: "Проєкт",
  type: "document",
  orderings: [orderRankOrdering],
  groups: [
    { name: "content", title: "Проєкт", default: true },
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
      title: "Назва проєкту",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Тип об’єкта",
      type: "string",
      group: "content",
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
      group: "content",
      description: "Як на сайті, наприклад 72 м².",
    }),
    defineField({
      name: "descriptionUa",
      title: "Опис",
      type: "array",
      group: "content",
      of: [{ type: "text", title: "Абзац", rows: 3 }],
    }),
    defineField({
      name: "cover",
      title: "Обкладинка",
      type: "image",
      group: "content",
      options: { hotspot: true },
      description: "Фото, яке буде показане у списку робіт на головній.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Галерея",
      type: "array",
      group: "content",
      of: [{ type: "projectMedia" }],
      options: { sortable: true },
      description:
        "Додайте фотографії у потрібному порядку. Перше фото — перше в галереї. Їх можна перетягувати.",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "workTypeUa",
      title: "Тип робіт",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "durationUa",
      title: "Термін виконання",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "year",
      title: "Рік",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "titleEn",
      title: "Назва",
      type: "string",
      group: "english",
      description: "Необов’язково. Якщо порожньо, на англійській версії сайту буде українська назва.",
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
      description:
        "Створюється автоматично. Не змінюйте, якщо не потрібно зберегти стару адресу проєкту.",
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
        "Впливає на розмір картки у блоці «Наші роботи». Якщо не впевнені — залиште значення без змін.",
      options: {
        list: [
          { title: "Велика картка", value: "large" },
          { title: "Вертикальна", value: "tall" },
          { title: "Широка", value: "wide" },
          { title: "Мала", value: "small" },
        ],
      },
      initialValue: "small",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "coverPosition",
      title: "Позиція обкладинки",
      type: "string",
      group: "advanced",
      initialValue: "center center",
      description:
        "Використовуйте лише якщо важлива частина фотографії обрізається неправильно. Наприклад: center 40%.",
    }),
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
            ? "Комерційне приміщення"
            : category === "apartment"
              ? "Квартира"
              : "";
      return {
        title: title || "Без назви",
        subtitle: [categoryLabel, area].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
