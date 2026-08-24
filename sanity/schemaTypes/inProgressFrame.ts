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
    objectPosition: "center center",
    frameId: { _type: "slug", current: uniqueDraftSlug("kadr") },
  }),
  fields: [
    orderRankField({ type: "inProgressFrame", hidden: true }),
    defineField({
      name: "label",
      title: "Назва для адмінки",
      type: "string",
      group: "content",
      description:
        "Лише в адмінці, на сайті не показується. Наприклад: Кухня — відео.",
    }),
    defineField({
      name: "still",
      title: "Фото",
      type: "image",
      group: "content",
      options: { hotspot: true },
      description: "Фото або кадр, який видно, поки не грає відео.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "video",
      title: "Відео",
      type: "file",
      group: "content",
      description: "Необов’язково.",
      options: { accept: "video/mp4,video/webm,video/quicktime" },
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
      label: "label",
      frameId: "frameId.current",
      media: "still",
      video: "video.asset",
      filename: "still.asset.originalFilename",
    },
    prepare: frameListPreview,
  },
});
