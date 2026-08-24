import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import type { StructureResolver } from "sanity/structure";
import { IN_PROGRESS_BOARD_ID } from "./schemaTypes/inProgressBoard";

function NavMark({ letter }: { letter: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: 18,
        height: 18,
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 600,
        color: "#f26a1f",
      }}
    >
      {letter}
    </span>
  );
}

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("DTM")
    .items([
      orderableDocumentListDeskItem({
        type: "project",
        title: "Наші роботи",
        icon: () => <NavMark letter="Н" />,
        S,
        context,
      }),
      S.listItem()
        .id("in-progress-root")
        .title("Об’єкти зараз у роботі")
        .icon(() => <NavMark letter="О" />)
        .child(
          S.list()
            .title("Об’єкти зараз у роботі")
            .items([
              orderableDocumentListDeskItem({
                type: "inProgressFrame",
                title: "Усі фото та відео",
                icon: () => <NavMark letter="У" />,
                S,
                context,
              }),
              S.listItem()
                .id("in-progress-board")
                .title("4 матеріали на головній")
                .icon(() => <NavMark letter="4" />)
                .child(
                  S.document()
                    .schemaType("inProgressBoard")
                    .documentId(IN_PROGRESS_BOARD_ID)
                    .title("4 матеріали на головній")
                ),
            ])
        ),
    ]);
