import { defineField, defineType } from "sanity";
import { FRAME_ADMIN_TITLES, uniqueBoardRefs } from "../lib/previews";

export const IN_PROGRESS_BOARD_ID = "inProgressBoard";

export const inProgressBoard = defineType({
  name: "inProgressBoard",
  title: "4 матеріали на головній",
  type: "document",
  fields: [
    defineField({
      name: "blinds",
      title: "Панелі зліва направо",
      type: "array",
      description:
        "Оберіть рівно 4 фото або відео для секції «Об’єкти зараз у роботі». Порядок тут відповідає порядку панелей на сайті зліва направо.",
      of: [
        {
          type: "reference",
          title: "Матеріал",
          to: [{ type: "inProgressFrame" }],
          weak: false,
          options: { disableNew: true },
        },
      ],
      validation: (Rule) => Rule.required().length(4).custom(uniqueBoardRefs),
    }),
  ],
  preview: {
    select: {
      a: "blinds.0->label",
      b: "blinds.1->label",
      c: "blinds.2->label",
      d: "blinds.3->label",
      aId: "blinds.0->frameId.current",
      bId: "blinds.1->frameId.current",
      cId: "blinds.2->frameId.current",
      dId: "blinds.3->frameId.current",
      media: "blinds.0->still",
    },
    prepare({ a, b, c, d, aId, bId, cId, dId, media }) {
      const names = [
        a || FRAME_ADMIN_TITLES[aId as string],
        b || FRAME_ADMIN_TITLES[bId as string],
        c || FRAME_ADMIN_TITLES[cId as string],
        d || FRAME_ADMIN_TITLES[dId as string],
      ].filter(Boolean);
      return {
        title: "4 матеріали на головній",
        subtitle: names.length ? names.join(" · ") : "Оберіть рівно 4 матеріали",
        media,
      };
    },
  },
});
