import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { sanityDataset, sanityProjectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

export default defineConfig({
  name: "dtm",
  title: "Сайт DTM",
  projectId: sanityProjectId,
  dataset: sanityDataset,
  basePath: "/admin",
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter((template) => template.id !== "inProgressBoard"),
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
