import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LexoRank } from "lexorank";
import {
  BASELINE_PATH,
  BOARD_ID,
  ROOT,
} from "./qa-cms-client.mjs";

export const PROJECTS_SNAP = `*[_type == "project" && !(_id in path("drafts.**"))] | order(orderRank asc) {
  _id, titleUa, "slug": slug.current, orderRank
}`;

export const FRAMES_SNAP = `*[_type == "inProgressFrame" && !(_id in path("drafts.**"))] | order(orderRank asc) {
  _id, "frameId": frameId.current, orderRank
}`;

export const BOARD_SNAP = `*[_id == $id && !(_id in path("drafts.**"))][0] {
  _id,
  blinds
}`;

export const QA_LEFTOVER = `*[_id match "dtm-qa-*" || _id match "drafts.dtm-qa-*"]{ _id }`;

export async function captureBaseline(client) {
  const [projects, frames, board, drafts] = await Promise.all([
    client.fetch(PROJECTS_SNAP),
    client.fetch(FRAMES_SNAP),
    client.fetch(BOARD_SNAP, { id: BOARD_ID }),
    client.fetch(
      `*[_id in path("drafts.**") && (_type == "project" || _type == "inProgressFrame" || _type == "inProgressBoard")]{ _id, _type }`
    ),
  ]);
  return {
    projects,
    frames,
    board,
    drafts: drafts ?? [],
    projectIds: (projects ?? []).map((row) => row._id),
    projectSlugs: (projects ?? []).map((row) => row.slug),
    frameIds: (frames ?? []).map((row) => row._id),
    frameSlugs: (frames ?? []).map((row) => row.frameId),
    boardRefs: (board?.blinds ?? []).map((item) => item._ref),
  };
}

export function persistBaseline(baseline) {
  mkdirSync(path.join(ROOT, "tmp"), { recursive: true });
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2));
}

export async function deleteQaDocuments(client) {
  const leftovers = await client.fetch(QA_LEFTOVER);
  for (const row of leftovers ?? []) {
    await client.delete(row._id).catch(() => undefined);
  }
}

export async function restoreFromBaseline(client, baseline) {
  if (baseline.board?.blinds) {
    await client
      .patch(BOARD_ID)
      .set({ blinds: baseline.board.blinds })
      .commit()
      .catch(async () => {
        await client.createOrReplace({
          _id: BOARD_ID,
          _type: "inProgressBoard",
          blinds: baseline.board.blinds,
        });
      });
    await client.delete(`drafts.${BOARD_ID}`).catch(() => undefined);
  }

  for (const row of baseline.projects ?? []) {
    if (!row._id || row._id.startsWith("dtm-qa-")) continue;
    await client.patch(row._id).set({ orderRank: row.orderRank }).commit();
  }
  for (const row of baseline.frames ?? []) {
    if (!row._id || row._id.startsWith("dtm-qa-")) continue;
    await client.patch(row._id).set({ orderRank: row.orderRank }).commit();
  }

  await deleteQaDocuments(client);
}

export async function assertMatchesBaseline(client, baseline) {
  const now = await captureBaseline(client);
  const leftover = await client.fetch(QA_LEFTOVER);
  const errors = [];
  if (now.projects.length !== baseline.projects.length) {
    errors.push(
      `project count ${now.projects.length} != ${baseline.projects.length}`
    );
  }
  if (JSON.stringify(now.projectIds) !== JSON.stringify(baseline.projectIds)) {
    errors.push("ordered project IDs differ from baseline");
  }
  if (now.frames.length !== baseline.frames.length) {
    errors.push(`frame count ${now.frames.length} != ${baseline.frames.length}`);
  }
  if (JSON.stringify(now.frameIds) !== JSON.stringify(baseline.frameIds)) {
    errors.push("ordered frame IDs differ from baseline");
  }
  if (JSON.stringify(now.boardRefs) !== JSON.stringify(baseline.boardRefs)) {
    errors.push("board refs differ from baseline");
  }
  if ((leftover ?? []).length > 0) {
    errors.push(
      `leftover QA docs: ${(leftover ?? []).map((row) => row._id).join(", ")}`
    );
  }
  return { now, errors };
}

export function rankAfter(lastRank) {
  if (!lastRank) return LexoRank.min().genNext().genNext().toString();
  return LexoRank.parse(lastRank).genNext().toString();
}

export function rankBefore(firstRank) {
  if (!firstRank) return LexoRank.min().genNext().toString();
  return LexoRank.parse(firstRank).genPrev().toString();
}

export function imageField(assetId) {
  return {
    _type: "image",
    asset: { _type: "reference", _ref: assetId },
  };
}

export function fileField(assetId) {
  return {
    _type: "file",
    asset: { _type: "reference", _ref: assetId },
  };
}

export function galleryItem(key, assetId, fit, objectPosition, thumbPosition) {
  return {
    _type: "projectMedia",
    _key: key,
    image: imageField(assetId),
    fit,
    objectPosition,
    thumbPosition,
  };
}
