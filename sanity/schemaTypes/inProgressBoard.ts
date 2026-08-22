import { defineField, defineType } from "sanity";

export const IN_PROGRESS_BOARD_ID = "inProgressBoard";

export const inProgressBoard = defineType({
  name: "inProgressBoard",
  title: "Композиція секції",
  type: "document",
  fields: [
    defineField({
      name: "blinds",
      title: "Чотири панелі на сайті",
      type: "array",
      description:
        "Рівно чотири різні матеріали. Порядок у списку — порядок жалюзі зліва направо.",
      of: [
        {
          type: "reference",
          to: [{ type: "inProgressFrame" }],
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
    prepare() {
      return { title: "Композиція секції" };
    },
  },
});
