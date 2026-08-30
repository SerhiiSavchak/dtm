import assert from "node:assert/strict";
import {
  frameListPreview,
  galleryItemPreview,
  projectListPreview,
  uniqueBoardRefs,
} from "../sanity/lib/previews.ts";

const project = projectListPreview({
  title: "Кухня-вітальня",
  category: "apartment",
  area: "72 м²",
  media: "cover",
});
assert.equal(project.title, "Кухня-вітальня");
assert.equal(project.subtitle, "Квартира · 72 м²");
assert.equal(projectListPreview({}).title, "Без назви");

const gallery = galleryItemPreview({
  filename: "kitchen.jpg",
  video: true,
  media: "img",
});
assert.equal(gallery.title, "kitchen.jpg");
assert.equal(gallery.subtitle, "Є відео");

const frame = frameListPreview({
  label: "Кухня — відео",
  frameId: "house-bedroom",
  video: true,
});
assert.equal(frame.title, "Кухня — відео");
assert.equal(frame.subtitle, "Відео + фото");

const unnamed = frameListPreview({ frameId: "house-bedroom" });
assert.equal(unnamed.title, "Спальня");
assert.notEqual(unnamed.title, "house-bedroom");

assert.equal(uniqueBoardRefs(undefined), "Потрібно рівно 4 матеріали");
assert.equal(
  uniqueBoardRefs([{ _ref: "a" }, { _ref: "b" }, { _ref: "c" }]),
  "Потрібно рівно 4 матеріали"
);
assert.equal(
  uniqueBoardRefs([{ _ref: "a" }, { _ref: "b" }, { _ref: "c" }, { _ref: "a" }]),
  "Кожен матеріал можна вибрати лише один раз"
);
assert.equal(
  uniqueBoardRefs([{ _ref: "a" }, { _ref: "b" }, { _ref: "c" }, { _ref: "d" }]),
  true
);

console.log("studio helpers ok");
