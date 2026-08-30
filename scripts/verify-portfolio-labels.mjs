import {
  portfolioCardLabels,
  dossierFacts,
  ukRoomCardLabel,
  locationDuplicatesTitle,
} from "../lib/portfolio/labels.ts";
import { recordToProject, mapSanityProject } from "../lib/sanity/map-project.ts";
import { dictionaries } from "../lib/i18n/dictionaries.ts";

const failures = [];

function assert(label, condition) {
  if (!condition) failures.push(label);
}

const dict = dictionaries.uk.projects;

const sokilnyky = mapSanityProject({
  titleUa: "вул. Затишна",
  slug: "private-house-sokilnyky",
  objectType: "private_house",
  category: "house",
  locationUa: "с. Сокільники, вул. Затишна",
  area: "265 м²",
  workTypeUa: "Реалізація за готовим дизайн-проєктом клієнта",
  durationUa: "9 міс.",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
});

const card = portfolioCardLabels(sokilnyky, "uk", dict);
assert("street title for sokilnyky", card.title === "вул. Затишна");
assert("card meta uses settlement context", card.meta === "Приватний будинок · Сокільники");
assert("card meta avoids street duplication", !card.meta?.includes("Затишна"));
assert("card meta avoids old settlement title", !card.title.includes("Сокільники"));

const novoznesenska = mapSanityProject({
  titleUa: "вул. Новознесенська",
  slug: "private-house-novoznesenska",
  objectType: "private_house",
  category: "house",
  locationUa: "м. Львів, вул. Новознесенська",
  area: "420 м²",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
});
assert(
  "novoznesenska meta",
  portfolioCardLabels(novoznesenska, "uk", dict).meta === "Приватний будинок · Львів"
);

const tiffany = mapSanityProject({
  titleUa: "ЖК Tiffany Apartments",
  slug: "tiffany-apartments-1-room",
  objectType: "new_build",
  category: "apartment",
  locationUa: "ЖК Tiffany Apartments",
  rooms: 1,
  area: "42 м²",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
});

const tiffanyProject = recordToProject(tiffany, "uk");
assert("ЖК prefix in title", tiffanyProject.title.startsWith("ЖК "));
assert("no room count in title", !tiffanyProject.title.includes("1-кімнат"));
assert("no bare Tiffany without ЖК", tiffanyProject.title !== "Tiffany Apartments");

const tiffanyCard = portfolioCardLabels(tiffany, "uk", dict);
assert("apartment meta with rooms", tiffanyCard.meta === "Новобудова · 1 кімната");
assert("meta does not repeat ЖК name", !tiffanyCard.meta?.includes("Tiffany"));

const tiffany2 = mapSanityProject({
  titleUa: "ЖК Tiffany Apartments",
  slug: "tiffany-apartments-2-room",
  objectType: "new_build",
  category: "apartment",
  locationUa: "ЖК Tiffany Apartments",
  rooms: 2,
  area: "64 м²",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
});
assert(
  "tiffany 2 room plural",
  portfolioCardLabels(tiffany2, "uk", dict).meta === "Новобудова · 2 кімнати"
);

assert("3 rooms plural", ukRoomCardLabel(3) === "3 кімнати");
assert("5 rooms genitive", ukRoomCardLabel(5) === "5 кімнат");

const commercial = mapSanityProject({
  titleUa: "вул. Червоної Калини",
  slug: "commercial-chervonoyi-kalyny",
  objectType: "commercial",
  category: "commercial",
  locationUa: "м. Львів, вул. Червоної Калини",
  area: "110 м²",
  coverUrl: "https://cdn.sanity.io/images/x/y/c.jpg",
  gallery: [{ src: "https://cdn.sanity.io/images/x/y/c.jpg" }],
});
assert(
  "commercial meta",
  portfolioCardLabels(commercial, "uk", dict).meta === "Комерційне приміщення · Львів"
);

const aptFacts = dossierFacts(tiffanyProject, dict);
assert("ЖК location omitted when duplicate", !aptFacts.some((f) => f.label === "Локація"));
assert(
  "ЖК duplicate detector",
  locationDuplicatesTitle("ЖК Tiffany Apartments", "ЖК Tiffany Apartments")
);

const houseFacts = dossierFacts(recordToProject(sokilnyky, "uk"), dict);
assert(
  "street project keeps location fact",
  houseFacts.some((f) => f.label === "Локація" && f.value.includes("Сокільники"))
);

if (failures.length) {
  console.error("portfolio labels failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("portfolio labels checks passed");
