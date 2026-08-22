import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import type { StructureResolver } from "sanity/structure";
import { IN_PROGRESS_BOARD_ID } from "./schemaTypes/inProgressBoard";

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Сайт DTM")
    .items([
      orderableDocumentListDeskItem({
        type: "project",
        title: "Наші роботи",
        S,
        context,
      }),
      S.listItem()
        .id("in-progress-root")
        .title("Об’єкти зараз у роботі")
        .child(
          S.list()
            .title("Об’єкти зараз у роботі")
            .items([
              orderableDocumentListDeskItem({
                type: "inProgressFrame",
                title: "Усі фото та відео",
                S,
                context,
              }),
              S.listItem()
                .id("in-progress-board")
                .title("4 матеріали на головній")
                .child(
                  S.document()
                    .schemaType("inProgressBoard")
                    .documentId(IN_PROGRESS_BOARD_ID)
                    .title("4 матеріали на головній")
                ),
            ])
        ),
    ]);
