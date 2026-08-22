import { defineField, defineType } from "sanity";

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
        "Оберіть рівно 4 фото або відео, які показуються у секції «Об’єкти зараз у роботі» на головній сторінці. Порядок у списку — порядок панелей зліва направо.",
      of: [
        {
          type: "reference",
          title: "Матеріал",
          to: [{ type: "inProgressFrame" }],
          options: { disableNew: true },
        },
      ],
      validation: (Rule) =>
        Rule.required()
          .length(4)
          .custom((blinds: { _ref?: string }[] | undefined) => {
            if (!blinds) return "Потрібно рівно 4 матеріали";
            const refs = blinds.map((item) => item?._ref).filter(Boolean);
            if (refs.length !== 4) return "Потрібно рівно 4 матеріали";
            if (new Set(refs).size !== refs.length) {
              return "Кожен матеріал можна вибрати лише один раз";
            }
            return true;
          }),
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
      const titles: Record<string, string> = {
        "house-living": "Вітальня",
        "house-bedroom": "Спальня",
        "house-vanity": "Санвузол",
        "kitchen-video": "Кухня — відео",
      };
      const names = [
        a || titles[aId as string],
        b || titles[bId as string],
        c || titles[cId as string],
        d || titles[dId as string],
      ].filter(Boolean);
      return {
        title: "4 матеріали на головній",
        subtitle: names.length ? names.join(" · ") : "Оберіть рівно 4 матеріали",
        media,
      };
    },
  },
});
