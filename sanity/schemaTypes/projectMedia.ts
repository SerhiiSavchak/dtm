import { defineField, defineType } from "sanity";

export const projectMedia = defineType({
  name: "projectMedia",
  title: "Кадр галереї",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Зображення",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "video",
      title: "Відео",
      type: "file",
      description: "Необов’язково. Залиште порожнім для звичайного фото.",
      options: { accept: "video/mp4,video/webm,video/quicktime" },
    }),
    defineField({
      name: "fit",
      title: "Як показувати в вікні проєкту",
      type: "string",
      options: {
        list: [
          { title: "Умістити повністю (без обрізання)", value: "contain" },
          { title: "Заповнити кадр (можливе обрізання)", value: "cover" },
        ],
        layout: "radio",
      },
      initialValue: "contain",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "objectPosition",
      title: "Позиція в великому вікні",
      type: "string",
      fieldset: "advanced",
      initialValue: "center center",
      description: "CSS object-position, наприклад center 40%.",
    }),
    defineField({
      name: "thumbPosition",
      title: "Позиція в мініатюрі",
      type: "string",
      fieldset: "advanced",
      initialValue: "center center",
      description: "Обрізання прев’ю під основним фото.",
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
      media: "image",
      fit: "fit",
      video: "video.asset",
    },
    prepare({ media, fit, video }) {
      return {
        title: video ? "Фото + відео" : "Фото",
        subtitle: fit === "cover" ? "Заповнити кадр" : "Умістити повністю",
        media,
      };
    },
  },
});
