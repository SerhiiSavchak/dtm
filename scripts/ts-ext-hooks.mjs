import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = new URL("../", import.meta.url);

function withTs(url) {
  const path = fileURLToPath(url);
  if (existsSync(path)) return pathToFileURL(path).href;
  if (existsSync(`${path}.ts`)) return pathToFileURL(`${path}.ts`).href;
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const matched = withTs(new URL(specifier.slice(2), ROOT).href);
    if (matched) return { shortCircuit: true, url: matched };
  }

  if (
    context.parentURL &&
    (specifier.startsWith("./") || specifier.startsWith("../"))
  ) {
    const matched = withTs(new URL(specifier, context.parentURL).href);
    if (matched) return { shortCircuit: true, url: matched };
  }

  return nextResolve(specifier, context);
}
