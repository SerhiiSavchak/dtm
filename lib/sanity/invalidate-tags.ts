import { revalidatePath, revalidateTag } from "next/cache";
import { type SanityCacheTag } from "./cache-tags";

/** Purge tagged Next.js Data Cache entries and the homepage route shell. */
export function invalidateSanityTags(tags: readonly SanityCacheTag[]): SanityCacheTag[] {
  const unique = [...new Set(tags)];
  for (const tag of unique) {
    revalidateTag(tag, { expire: 0 });
  }
  if (unique.length > 0) {
    revalidatePath("/", "page");
  }
  return unique;
}
