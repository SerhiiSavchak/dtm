import { defineField, defineType } from "sanity";
import { galleryItemPreview } from "../lib/previews";

export const projectMedia = defineType({
  name: "projectMedia",
  title: "Фото в галереї",
  type: "object",
  groups: [
    { name: "main", title: "Фото", default: true },
    { name: "advanced", title: "Додаткові налаштування" },
  ],
  initialValue: {
    fit: "contain",
    objectPosition: "center center",
    thumbPosition: "center center",
  },
  fields: [
    defineField({
      name: "image",
      title: "Фото",
      type: "image",
      group: "main",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "video",
      title: "Відео",
      type: "file",
      group: "main",
      description: "Необов’язково. Залиште порожнім для звичайного фото.",
      options: { accept: "video/mp4,video/webm,video/quicktime" },
    }),
    defineField({
      name: "fit",
      title: "Відображення фото",
      type: "string",
      group: "advanced",
      options: {
        list: [
          { title: "Показати цілком, без обрізання", value: "contain" },
          { title: "Заповнити вікно (краї можуть обрізатися)", value: "cover" },
        ],
        layout: "radio",
      },
      initialValue: "contain",
      validation: (Rule) => Rule.required(),
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
      name: "thumbPosition",
      title: "Позиція мініатюри",
      type: "string",
      group: "advanced",
      initialValue: "center center",
      description: "Як обрізати маленьке прев’ю під основним фото.",
    }),
  ],
  preview: {
    select: {
      media: "image",
      filename: "image.asset.originalFilename",
      video: "video.asset",
    },
    prepare: galleryItemPreview,
  },
});
