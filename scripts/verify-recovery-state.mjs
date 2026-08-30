import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-08-22" });
if (client.config().dataset !== "development") {
  throw new Error("Dataset must be development");
}

const projects = await client.fetch(
  `*[_type == "project"] | order(orderRank) {
    _id, titleUa, "hasCover": defined(cover.asset),
    "gal": count(gallery), "galWithImage": count(gallery[defined(image.asset)])
  }`
);
const frames = await client.fetch(`count(*[_type == "inProgressFrame"])`);
const board = await client.fetch(
  `*[_id == "inProgressBoard"][0]{ "refs": blinds[]._ref }`
);
const drafts = await client.fetch(`*[_id in path("drafts.**")]{ _id, _type }`);
const bad = /хуй|порн|porn/i;
const scan = await client.fetch(
  `*[_type in ["project", "inProgressFrame", "inProgressBoard"]]`
);
const hits = scan.filter((doc) => bad.test(JSON.stringify(doc))).map((doc) => doc._id);

console.log(JSON.stringify({ projects, frames, board, drafts, hits }, null, 2));
