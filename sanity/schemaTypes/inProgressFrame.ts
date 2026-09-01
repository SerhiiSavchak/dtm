import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";
import { frameListPreview } from "../lib/previews";
import { uniqueDraftSlug } from "../lib/slugify";

export const inProgressFrame = defineType({
  name: "inProgressFrame",
  title: "Фото або відео з об’єкта",
  type: "document",
  orderings: [orderRankOrdering],
  groups: [
    { name: "content", title: "Матеріал", default: true },
    { name: "advanced", title: "Додаткові налаштування" },
  ],
  initialValue: () => ({
    mediaType: "photo",
    objectPosition: "center center",
    frameId: { _type: "slug", current: uniqueDraftSlug("kadr") },
  }),
  fields: [
    orderRankField({ type: "inProgressFrame", hidden: true }),
    defineField({
      name: "titleUa",
      title: "Назва об'єкта",
      type: "string",
      group: "content",
      description: "Наприклад: ЖК Perfect Life або вул. Зелена",
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(80)
          .custom((value) => {
            if (typeof value !== "string") return "Вкажіть назву об’єкта.";
            if (!value.trim()) return "Вкажіть назву об’єкта.";
            if (value.trim().length > 80) return "Назва занадто довга (до 80 символів).";
            return true;
          }),
    }),
    defineField({
      name: "titleEn",
      title: "Назва англійською",
      type: "string",
      group: "content",
      description:
        "Необов’язково. Якщо порожньо — на англійській версії сайту покажеться українська назва.",
      validation: (Rule) =>
        Rule.max(80).custom((value) => {
          if (value == null || value === "") return true;
          if (typeof value !== "string") return true;
          if (value.trim().length > 80) return "Назва занадто довга (до 80 символів).";
          return true;
        }),
    }),
    defineField({
      name: "area",
      title: "Площа, м²",
      type: "number",
      group: "content",
      description: "Необов’язково. Лише число, без «м²».",
      validation: (Rule) =>
        Rule.integer()
          .positive()
          .max(10_000)
          .error("Площа має бути додатним числом."),
    }),
    defineField({
      name: "label",
      title: "Внутрішня примітка",
      type: "string",
      group: "advanced",
      description:
        "Лише в адмінці, на сайті не показується. Наприклад: Кухня — відео.",
    }),
    defineField({
      name: "mediaType",
      title: "Тип матеріалу",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Фото", value: "photo" },
          { title: "Відео", value: "video" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "still",
      title: "Фото",
      type: "image",
      group: "content",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType === "video",
      description: "Завантажте фото об’єкта.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const mediaType = (context.parent as { mediaType?: string })?.mediaType;
          if (mediaType === "photo" && !value?.asset) {
            return "Додайте фото.";
          }
          return true;
        }),
    }),
    defineField({
      name: "video",
      title: "Відео",
      type: "file",
      group: "content",
      hidden: ({ parent }) => parent?.mediaType !== "video",
      description: "Завантажте відео об’єкта.",
      options: { accept: "video/mp4,video/webm,video/quicktime" },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const mediaType = (context.parent as { mediaType?: string })?.mediaType;
          if (mediaType === "video" && !value?.asset) {
            return "Додайте відео.";
          }
          return true;
        }),
    }),
    defineField({
      name: "previewVideo",
      title: "Прев’ю для головної (авто)",
      type: "file",
      group: "advanced",
      hidden: true,
      readOnly: true,
      description:
        "Легка 720p копія для панелей на головній. Заповнюється імпортом; клієнт не редагує.",
      options: { accept: "video/mp4" },
    }),
    defineField({
      name: "poster",
      title: "Обкладинка відео",
      type: "image",
      group: "content",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType !== "video",
      description:
        "Необов’язково. Якщо обкладинку не додано, сайт використає саме відео як прев’ю.",
    }),
    defineField({
      name: "objectPosition",
      title: "Позиція фото",
      type: "string",
      group: "advanced",
      initialValue: "center center",
      description:
        "Лише якщо важлива частина фотографії обрізається неправильно.",
    }),
    defineField({
      name: "frameId",
      title: "Системний ідентифікатор",
      type: "slug",
      group: "advanced",
      hidden: true,
      readOnly: true,
      options: {
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      titleUa: "titleUa",
      label: "label",
      area: "area",
      frameId: "frameId.current",
      mediaType: "mediaType",
      still: "still",
      poster: "poster",
      video: "video.asset",
      filename: "still.asset.originalFilename",
    },
    prepare: frameListPreview,
  },
});
