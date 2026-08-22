import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

export const inProgressFrame = defineType({
  name: "inProgressFrame",
  title: "Матеріали об’єктів у роботі",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "inProgressFrame", hidden: true }),
    defineField({
      name: "frameId",
      title: "Ідентифікатор",
      type: "slug",
      description: "Латиницею, наприклад kitchen-video. Не змінюйте після публікації.",
      options: {
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "still",
      title: "Фото",
      type: "image",
      options: { hotspot: true },
      description: "Саме фото або кадр-постер, якщо є відео.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "video",
      title: "Відео",
      type: "file",
      options: { accept: "video/mp4,video/webm,video/quicktime" },
    }),
    defineField({
      name: "objectPosition",
      title: "Позиція зображення",
      type: "string",
      fieldset: "advanced",
      initialValue: "center center",
      description: "CSS object-position, наприклад 50% 42%.",
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
      frameId: "frameId.current",
      media: "still",
      video: "video.asset",
    },
    prepare({ frameId, media, video }) {
      return {
        title: frameId || "Без ідентифікатора",
        subtitle: video ? "Відео" : "Фото",
        media,
      };
    },
  },
});
