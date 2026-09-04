import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

import { defineField, defineType } from "sanity";

import { projectListPreview } from "../lib/previews";

import { slugifyUa, uniqueDraftSlug } from "../lib/slugify";



const OBJECT_TYPE_OPTIONS = [

  { title: "Новобудова", value: "new_build" },

  { title: "Вторинне житло", value: "secondary" },

  { title: "Приватний будинок", value: "private_house" },

  { title: "Комерційне приміщення", value: "commercial" },

];



function categoryFromObjectType(objectType: string | undefined) {

  if (objectType === "private_house") return "house";

  if (objectType === "commercial") return "commercial";

  if (objectType === "new_build" || objectType === "secondary") return "apartment";

  return undefined;

}



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

    span: "small",

    coverPosition: "center center",

    slug: { _type: "slug", current: uniqueDraftSlug("proekt") },

  }),

  fields: [

    orderRankField({ type: "project", hidden: true }),

    defineField({

      name: "titleUa",

      title: "Назва об'єкта",

      type: "string",

      group: "main",

      description:

        "Для ЖК вказуйте назву з префіксом «ЖК». Для окремого будинку чи комерційного об'єкта можна використовувати вулицю. Не додавайте площу, кількість кімнат або тип об'єкта.",

      validation: (Rule) => Rule.required(),

    }),

    defineField({

      name: "objectType",

      title: "Тип об'єкта",

      type: "string",

      group: "main",

      options: {

        list: OBJECT_TYPE_OPTIONS,

        layout: "radio",

      },

      validation: (Rule) => Rule.required(),

    }),

    defineField({

      name: "category",

      title: "Технічна категорія",

      type: "string",

      group: "advanced",

      hidden: true,

      readOnly: true,

      description: "Заповнюється автоматично з типу об'єкта.",

    }),

    defineField({

      name: "locationUa",

      title: "Локація",

      type: "string",

      group: "main",

      description:

        "Повна адреса або назва ЖК. Наприклад: м. Львів, вул. … або ЖК Tiffany Apartments.",

    }),

    defineField({

      name: "area",

      title: "Площа",

      type: "string",

      group: "main",

      description: "Як на сайті, наприклад 72 м².",

    }),

    defineField({

      name: "rooms",

      title: "Кількість кімнат",

      type: "number",

      group: "main",

      description: "Лише для квартир. Для будинків і комерції залиште порожнім.",

      validation: (Rule) => Rule.integer().min(1).max(20),

      hidden: ({ document }) => {

        const objectType = document?.objectType;

        if (objectType === "new_build" || objectType === "secondary") return false;

        return document?.category !== "apartment";

      },

    }),

    defineField({

      name: "descriptionUa",

      title: "Опис",

      type: "array",

      group: "main",

      of: [{ type: "text", title: "Абзац", rows: 3 }],

      description: "Необов'язково. Якщо порожньо — на сайті блок опису не показується.",

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

        "Додайте кілька фото. Порядок у списку — порядок у вікні проєкту. Перетягніть, щоб змінити.",

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

      title: "Рік (застаріле)",

      type: "string",

      group: "details",

      hidden: true,

      description: "Не показуємо на сайті. Залиште порожнім.",

    }),

    defineField({

      name: "titleEn",

      title: "Назва",

      type: "string",

      group: "english",

      description:

        "Необов'язково. Якщо порожньо, англійською покажеться українська назва.",

    }),

    defineField({

      name: "locationEn",

      title: "Location",

      type: "string",

      group: "english",

      description: "Optional. Falls back to Ukrainian location when empty.",

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

      title: "Місто (legacy)",

      type: "string",

      group: "advanced",

      hidden: true,

      options: {

        list: [{ title: "Львів", value: "lviv" }],

      },

      description: "Застаріле поле.",

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

        "Візуальний розмір картки цього проєкту в портфоліо на сайті.",

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

        "Лише якщо важлива частина обкладинки обрізається неправильно.",

    }),

  ],

  preview: {

    select: {

      title: "titleUa",

      objectType: "objectType",

      area: "area",

      media: "cover",

    },

    prepare: projectListPreview,

  },

});



export { categoryFromObjectType };


