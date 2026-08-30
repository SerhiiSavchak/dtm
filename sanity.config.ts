import { DtmStudioIcon } from "./sanity/dtm-icon";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { sanityDataset, sanityProjectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

export default defineConfig({
  name: "dtm",
  title: "DTM",
  icon: DtmStudioIcon,
  projectId: sanityProjectId,
  dataset: sanityDataset,
  basePath: "/admin",
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates
        .filter((template) => template.id !== "inProgressBoard")
        .map((template) => {
          if (template.schemaType === "project") {
            return { ...template, title: "Робота" };
          }
          if (template.schemaType === "inProgressFrame") {
            return { ...template, title: "Фото або відео" };
          }
          return template;
        }),
  },
  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === "global") {
        return prev.filter((item) => item.templateId !== "inProgressBoard");
      }
      return prev;
    },
    actions: (prev, { schemaType }) => {
      if (schemaType !== "inProgressBoard") return prev;
      return prev.filter((item) => {
        const name = item.action;
        return name !== "delete" && name !== "duplicate";
      });
    },
  },
});
