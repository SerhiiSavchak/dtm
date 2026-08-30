import type { ProjectCategory } from "@/data/projects";

export const OBJECT_TYPES = [
  "new_build",
  "secondary",
  "private_house",
  "commercial",
] as const;

export type ObjectType = (typeof OBJECT_TYPES)[number];

export function isObjectType(value: unknown): value is ObjectType {
  return (
    typeof value === "string" &&
    (OBJECT_TYPES as readonly string[]).includes(value)
  );
}

/** Technical category derived from client-facing classification. */
export function categoryFromObjectType(objectType: ObjectType): ProjectCategory {
  if (objectType === "private_house") return "house";
  if (objectType === "commercial") return "commercial";
  return "apartment";
}

export function objectTypeFromCategory(
  category: ProjectCategory
): ObjectType | null {
  if (category === "house") return "private_house";
  if (category === "commercial") return "commercial";
  return null;
}
