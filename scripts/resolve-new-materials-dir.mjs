import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Client source media lives outside public/ and is never shipped as site assets.
 * Legacy path public/new-materials is still accepted for older working copies.
 */
export function resolveNewMaterialsDir(root) {
  const preferred = path.join(root, "new-materials");
  const legacy = path.join(root, "public", "new-materials");
  if (existsSync(preferred)) return preferred;
  if (existsSync(legacy)) return legacy;
  return preferred;
}
