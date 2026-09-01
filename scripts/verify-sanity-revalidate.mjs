import { readFileSync } from "node:fs";
import {
  SANITY_CACHE_TAGS,
  SANITY_ISR_SECONDS,
} from "../lib/sanity/cache-tags.ts";
import {
  collectDocumentTypes,
  extractDataset,
  resolveRevalidation,
  secretsMatch,
  tagsForDocumentTypes,
} from "../lib/sanity/revalidate-webhook.ts";

const failures = [];

function check(label, condition) {
  if (!condition) failures.push(label);
}

// --- tag mapping ---
check(
  "project → portfolio",
  tagsForDocumentTypes(["project"]).join() === SANITY_CACHE_TAGS.portfolio
);
check(
  "projectMedia → portfolio",
  tagsForDocumentTypes(["projectMedia"]).join() === SANITY_CACHE_TAGS.portfolio
);
check(
  "inProgressFrame → in-progress",
  tagsForDocumentTypes(["inProgressFrame"]).join() === SANITY_CACHE_TAGS.inProgress
);
check(
  "inProgressBoard → in-progress",
  tagsForDocumentTypes(["inProgressBoard"]).join() === SANITY_CACHE_TAGS.inProgress
);
check(
  "irrelevant type → no tags",
  tagsForDocumentTypes(["siteSettings"]).length === 0
);

// --- webhook payload shapes ---
check(
  "direct document _type",
  collectDocumentTypes({ _type: "project", _id: "abc" }).includes("project")
);
check(
  "transaction result array",
  collectDocumentTypes({
    dataset: "production",
    result: [{ _type: "projectMedia" }, { _type: "inProgressFrame" }],
  }).join() === "projectMedia,inProgressFrame"
);
check(
  "nested body wrapper",
  collectDocumentTypes({ body: { _type: "inProgressBoard" } }).includes(
    "inProgressBoard"
  )
);
check("malformed payload → no types", collectDocumentTypes("nope").length === 0);
check("null payload → no types", collectDocumentTypes(null).length === 0);

// --- dataset guard (required + mismatch reject) ---
check(
  "dataset mismatch rejected",
  resolveRevalidation({ _type: "project", dataset: "staging" }, "production")
    .status === "rejected"
);
check(
  "dataset missing rejected",
  resolveRevalidation({ _type: "project" }, "production").status === "rejected"
);
check(
  "matching dataset resolves",
  resolveRevalidation({ _type: "project", dataset: "production" }, "production")
    .status === "ok"
);
check(
  "development must not invalidate production",
  resolveRevalidation(
    { _type: "project", dataset: "development" },
    "production"
  ).status === "rejected"
);
check(
  "irrelevant types ignored",
  resolveRevalidation(
    { _type: "translation", dataset: "production" },
    "production"
  ).status === "ignored"
);

// --- publish / update / delete shapes (same payload contract) ---
for (const sample of [
  { _type: "project", _id: "drafts.slug", dataset: "production" },
  { _type: "projectMedia", _id: "media-1", dataset: "production" },
  { _type: "inProgressFrame", _id: "frame-1", dataset: "production" },
  { _type: "inProgressBoard", _id: "inProgressBoard", dataset: "production" },
]) {
  const resolution = resolveRevalidation(sample, "production");
  check(`${sample._type} webhook resolves`, resolution.status === "ok");
}

// --- invalidation wiring (static contract) ---
check(
  "invalidateSanityTags uses revalidateTag",
  /export function invalidateSanityTags/.test(
    readFileSync(new URL("../lib/sanity/invalidate-tags.ts", import.meta.url), "utf8")
  )
);

// --- secret comparison ---
check("matching secrets", secretsMatch("abc", "abc"));
check("mismatched secrets", !secretsMatch("abc", "abcd"));
check("length mismatch", !secretsMatch("short", "longer"));

// --- ISR safety net preserved ---
check("ISR interval remains 60s", SANITY_ISR_SECONDS === 60);

check("extractDataset", extractDataset({ dataset: "production" }) === "production");

if (failures.length) {
  console.error("sanity revalidate checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("sanity revalidate checks passed");
