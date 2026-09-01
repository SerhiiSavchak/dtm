import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inProgressBoard } from "../sanity/schemaTypes/inProgressBoard.ts";
import { inProgressFrame } from "../sanity/schemaTypes/inProgressFrame.ts";
import { project } from "../sanity/schemaTypes/project.ts";
import { uniqueDraftSlug } from "../sanity/lib/slugify.ts";

function field(type, name) {
  const found = type.fields.find((item) => item.name === name);
  assert.ok(found, `missing field ${type.name}.${name}`);
  return found;
}

assert.deepEqual(
  project.groups.map((g) => g.title),
  [
    "Основне",
    "Фото",
    "Деталі",
    "Англійська версія",
    "Додаткові налаштування",
  ]
);
assert.equal(field(project, "titleUa").title, "Назва об'єкта");
assert.equal(field(project, "objectType").title, "Тип об'єкта");
assert.equal(field(project, "category").hidden, true);
assert.equal(field(project, "slug").hidden, true);
assert.equal(field(project, "slug").readOnly, true);
assert.equal(field(project, "locationKey").hidden, true);
assert.equal(field(project, "locationUa").title, "Локація");
assert.equal(field(project, "rooms").title, "Кількість кімнат");
assert.equal(field(project, "year").hidden, true);
assert.equal(field(project, "orderRank").hidden, true);

const initials = project.initialValue();
assert.equal(initials.span, "small");
assert.equal(initials.slug._type, "slug");
assert.match(initials.slug.current, /^proekt-/);

assert.deepEqual(
  inProgressFrame.groups.map((g) => g.title),
  ["Матеріал", "Додаткові налаштування"]
);
assert.equal(field(inProgressFrame, "titleUa").title, "Назва об'єкта");
assert.equal(field(inProgressFrame, "area").title, "Площа, м²");
assert.equal(field(inProgressFrame, "label").title, "Внутрішня примітка");
assert.equal(field(inProgressFrame, "label").group, "advanced");
assert.equal(field(inProgressFrame, "mediaType").title, "Тип матеріалу");
assert.equal(field(inProgressFrame, "poster").title, "Обкладинка відео");
assert.equal(field(inProgressFrame, "frameId").hidden, true);
assert.equal(field(inProgressFrame, "frameId").readOnly, true);
assert.equal(field(inProgressFrame, "orderRank").hidden, true);

const boardField = field(inProgressBoard, "blinds");
assert.equal(inProgressBoard.title, "4 матеріали на головній");
assert.equal(boardField.of[0].weak, false);

const config = readFileSync(new URL("../sanity.config.ts", import.meta.url), "utf8");
assert.match(config, /schemaType !== "inProgressBoard"/);
assert.match(config, /name !== "delete"/);
assert.match(config, /name !== "duplicate"/);
assert.match(config, /templateId !== "inProgressBoard"/);
assert.match(config, /basePath: "\/admin"/);

assert.match(uniqueDraftSlug("kadr"), /^kadr-/);

console.log("studio schema config ok");
