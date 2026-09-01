/**
 * Development-only CMS acceptance mutations.
 * Dataset is hardcoded to "development". No --dataset override.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  abort,
  createQaWriteClient,
  QA_FRAME_ID,
  QA_FRAME_SLUG,
  QA_PROJECT_ID,
  QA_PROJECT_SLUG,
  ROOT,
  STATE_PATH,
  WRITE_DATASET,
  BOARD_ID,
} from "./qa-cms-client.mjs";
import {
  assertMatchesBaseline,
  captureBaseline,
  deleteQaDocuments,
  fileField,
  galleryItem,
  imageField,
  persistBaseline,
  rankAfter,
  rankBefore,
  restoreFromBaseline,
} from "./qa-cms-ops.mjs";

const PORTFOLIO_QUERY = `*[_type == "project"
  && !(_id in path("drafts.**"))
  && defined(slug.current)
  && defined(cover.asset)
  && count(gallery) > 0
] | order(orderRank asc) {
  titleUa,
  "slug": slug.current,
  "coverUrl": cover.asset->url,
  gallery[] { fit, objectPosition, thumbPosition, "src": image.asset->url }
}`;

const FRAMES_QUERY = `*[_type == "inProgressFrame"
  && !(_id in path("drafts.**"))
  && defined(frameId.current)
  && (defined(still.asset) || defined(poster.asset) || defined(video.asset))
] | order(orderRank asc) {
  _id,
  "frameId": frameId.current,
  mediaType,
  "src": coalesce(poster.asset->url, still.asset->url),
  "video": video.asset->url
}`;

const BOARD_QUERY = `*[_id == "inProgressBoard" && !(_id in path("drafts.**"))][0] {
  "boardIds": blinds[]->frameId.current,
  "refs": blinds[]._ref
}`;

function fail(failures, label, ok) {
  if (!ok) failures.push(label);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

async function publishedPortfolio(client) {
  return client.withConfig({ perspective: "published" }).fetch(PORTFOLIO_QUERY);
}

async function publishedInProgress(client) {
  const pub = client.withConfig({ perspective: "published" });
  const [frames, board] = await Promise.all([
    pub.fetch(FRAMES_QUERY),
    pub.fetch(BOARD_QUERY),
  ]);
  return { frames, board };
}

async function loadAssets(client) {
  const donor = await client.fetch(`*[_type == "project"
    && defined(cover.asset)
    && count(gallery) > 1
  ] | order(orderRank asc)[0] {
    "cover": cover.asset._ref,
    "gallery": gallery[].image.asset._ref
  }`);
  if (!donor?.cover || !donor.gallery?.length) {
    abort("No existing published project assets to reuse for QA.");
  }
  const videoDonor = await client.fetch(`*[_type == "inProgressFrame" && defined(video.asset)][0] {
    "still": still.asset._ref,
    "poster": poster.asset._ref,
    "video": video.asset._ref
  }`);
  const stillDonor = await client.fetch(
    `*[_type == "inProgressFrame" && (defined(still.asset) || defined(poster.asset))][0]{
      "still": coalesce(still.asset._ref, poster.asset._ref)
    }`
  );
  return {
    cover: donor.cover,
    gallery: donor.gallery.filter(Boolean),
    still: videoDonor?.still || videoDonor?.poster || stillDonor?.still || donor.cover,
    video: videoDonor?.video || null,
  };
}

function projectDoc({ titleUa, orderRank, cover, gallery }) {
  return {
    _id: QA_PROJECT_ID,
    _type: "project",
    titleUa,
    titleEn: "QA — Test apartment",
    slug: { _type: "slug", current: QA_PROJECT_SLUG },
    category: "apartment",
    locationKey: "lviv",
    descriptionUa: [
      "QA-only description. Not a real DTM project.",
      "Used solely for automated CMS acceptance.",
    ],
    area: "48 м²",
    workTypeUa: "QA ремонт",
    durationUa: "QA термін",
    year: "2026",
    span: "small",
    coverPosition: "center center",
    cover: imageField(cover),
    gallery,
    orderRank,
  };
}

async function writePublishedProject(client, doc) {
  await client.delete(`drafts.${QA_PROJECT_ID}`).catch(() => undefined);
  await client.createOrReplace(doc);
}

async function cleanupPhase() {
  const { client } = await createQaWriteClient();
  if (!existsSync(path.join(ROOT, "tmp", "cms-qa-baseline.json"))) {
    abort("Cleanup requested but baseline file is missing.");
  }
  const baseline = JSON.parse(
    readFileSync(path.join(ROOT, "tmp", "cms-qa-baseline.json"), "utf8")
  );
  await restoreFromBaseline(client, baseline);
  const { errors } = await assertMatchesBaseline(client, baseline);
  if (errors.length) abort(`Cleanup failed: ${errors.join("; ")}`);
  console.log("[qa-cms] Cleanup matched baseline.");
  console.log("[qa-cms] write dataset:", client.config().dataset);
}

async function mutatePhase() {
  const { client } = await createQaWriteClient();
  const failures = [];
  const notes = {};
  let baseline;

  try {
    await deleteQaDocuments(client);

    baseline = await captureBaseline(client);
    persistBaseline(baseline);
    console.log("[qa-cms] Baseline projects:", baseline.projects.length);
    console.log("[qa-cms] Baseline slugs:", baseline.projectSlugs.join(", "));
    console.log("[qa-cms] Baseline frames:", baseline.frames.length);
    console.log("[qa-cms] Baseline board:", baseline.boardRefs.join(" → "));
    console.log(
      "[qa-cms] Pre-existing drafts (untouched):",
      baseline.drafts.map((row) => row._id).join(", ") || "(none)"
    );
    fail(
      failures,
      "dataset is development",
      client.config().dataset === WRITE_DATASET
    );
    fail(failures, "board has 4 refs", baseline.boardRefs.length === 4);

    const assets = await loadAssets(client);
    const startRank = rankAfter(
      baseline.projects[baseline.projects.length - 1]?.orderRank
    );
    const g1 = galleryItem(
      "qa-g1",
      assets.gallery[0] || assets.cover,
      "contain",
      "center center",
      "center center"
    );

    await writePublishedProject(
      client,
      projectDoc({
        titleUa: "QA — Тестова квартира",
        orderRank: startRank,
        cover: assets.cover,
        gallery: [g1],
      })
    );

    let pub = await publishedPortfolio(client);
    fail(
      failures,
      "fallback inactive after create",
      pub.length === baseline.projects.length + 1
    );
    const created = pub.find((row) => row.slug === QA_PROJECT_SLUG);
    fail(failures, "QA project in published GROQ", Boolean(created));
    fail(
      failures,
      "create title",
      created?.titleUa === "QA — Тестова квартира"
    );
    fail(failures, "cover resolves", Boolean(created?.coverUrl));
    fail(failures, "gallery 1 item", created?.gallery?.length === 1);
    const createdId = await client.fetch(`*[_id == $id][0]._id`, {
      id: QA_PROJECT_ID,
    });
    fail(failures, "deterministic project id", createdId === QA_PROJECT_ID);

    await client
      .patch(QA_PROJECT_ID)
      .set({ titleUa: "QA — Тестова квартира NEW" })
      .commit();
    const renamed = await client.fetch(
      `*[_id == $id][0]{ _id, titleUa, "slug": slug.current, "g": count(gallery), orderRank }`,
      { id: QA_PROJECT_ID }
    );
    fail(failures, "rename keeps document id", renamed._id === QA_PROJECT_ID);
    fail(failures, "rename keeps slug", renamed.slug === QA_PROJECT_SLUG);
    fail(failures, "rename keeps gallery", renamed.g === 1);
    fail(
      failures,
      "rename keeps orderRank",
      renamed.orderRank === startRank
    );
    const dupCount = await client.fetch(
      `count(*[_type == "project" && slug.current == $slug && !(_id in path("drafts.**"))])`,
      { slug: QA_PROJECT_SLUG }
    );
    fail(failures, "rename does not duplicate", dupCount === 1);
    pub = await publishedPortfolio(client);
    fail(
      failures,
      "frontend title after rename",
      pub.find((row) => row.slug === QA_PROJECT_SLUG)?.titleUa ===
        "QA — Тестова квартира NEW"
    );

    await client.patch(QA_PROJECT_ID).set({ titleUa: "QA — Published A" }).commit();
    pub = await publishedPortfolio(client);
    fail(
      failures,
      "published A on frontend",
      pub.find((row) => row.slug === QA_PROJECT_SLUG)?.titleUa ===
        "QA — Published A"
    );

    const publishedSnap = await client.getDocument(QA_PROJECT_ID);
    await client.createOrReplace({
      ...publishedSnap,
      _id: `drafts.${QA_PROJECT_ID}`,
      titleUa: "QA — Draft B",
    });
    pub = await publishedPortfolio(client);
    fail(
      failures,
      "draft B hidden from published GROQ",
      pub.find((row) => row.slug === QA_PROJECT_SLUG)?.titleUa ===
        "QA — Published A"
    );
    const draftOnly = await client.fetch(
      `*[_id == $id][0].titleUa`,
      { id: `drafts.${QA_PROJECT_ID}` }
    );
    fail(failures, "draft B stored", draftOnly === "QA — Draft B");

    const draftDoc = await client.getDocument(`drafts.${QA_PROJECT_ID}`);
    await writePublishedProject(client, {
      ...draftDoc,
      _id: QA_PROJECT_ID,
    });
    pub = await publishedPortfolio(client);
    fail(
      failures,
      "publish B on frontend",
      pub.find((row) => row.slug === QA_PROJECT_SLUG)?.titleUa === "QA — Draft B"
    );

    await client.createOrReplace({
      ...(await client.getDocument(QA_PROJECT_ID)),
      _id: `drafts.${QA_PROJECT_ID}`,
      titleUa: "QA — discarded",
    });
    await client.delete(`drafts.${QA_PROJECT_ID}`);
    pub = await publishedPortfolio(client);
    fail(
      failures,
      "discard draft keeps published B",
      pub.find((row) => row.slug === QA_PROJECT_SLUG)?.titleUa === "QA — Draft B"
    );

    const gMany = [
      galleryItem("qa-g1", assets.gallery[0] || assets.cover, "contain", "center 20%", "center 20%"),
      galleryItem(
        "qa-g2",
        assets.gallery[1] || assets.gallery[0] || assets.cover,
        "cover",
        "center 40%",
        "center 40%"
      ),
      galleryItem("qa-g3", assets.cover, "contain", "center center", "center 60%"),
    ];
    await client.patch(QA_PROJECT_ID).set({ gallery: gMany }).commit();
    pub = await publishedPortfolio(client);
    const g = pub.find((row) => row.slug === QA_PROJECT_SLUG)?.gallery ?? [];
    fail(failures, "gallery several items", g.length === 3);
    fail(failures, "gallery contain/cover", g[0]?.fit === "contain" && g[1]?.fit === "cover");
    fail(failures, "cover also in gallery", Boolean(g[2]?.src));
    await client
      .patch(QA_PROJECT_ID)
      .set({ gallery: [gMany[2], gMany[0], gMany[1]] })
      .commit();
    pub = await publishedPortfolio(client);
    const gre = pub.find((row) => row.slug === QA_PROJECT_SLUG)?.gallery ?? [];
    fail(
      failures,
      "gallery reorder",
      gre[0]?.objectPosition === "center center" && gre[1]?.objectPosition === "center 20%"
    );

    await client
      .patch(QA_PROJECT_ID)
      .set({ titleUa: "QA — Тестова квартира NEW" })
      .commit();

    const firstRank = rankBefore(baseline.projects[0]?.orderRank);
    await client.patch(QA_PROJECT_ID).set({ orderRank: firstRank }).commit();
    pub = await publishedPortfolio(client);
    fail(failures, "QA first after reorder", pub[0]?.slug === QA_PROJECT_SLUG);
    fail(
      failures,
      "lead slug is QA",
      pub[0]?.slug === QA_PROJECT_SLUG
    );

    for (const row of baseline.projects) {
      await client.patch(row._id).set({ orderRank: row.orderRank }).commit();
    }
    await client.patch(QA_PROJECT_ID).set({ orderRank: startRank }).commit();
    pub = await publishedPortfolio(client);
    fail(
      failures,
      "portfolio order restored (QA last)",
      pub[0]?.slug === baseline.projectSlugs[0] &&
        pub.find((row) => row.slug === QA_PROJECT_SLUG)?.slug === QA_PROJECT_SLUG
    );

    const a = client.withConfig({ perspective: "raw" });
    const b = client.withConfig({ perspective: "raw" });
    await Promise.all([
      a.patch(QA_PROJECT_ID).set({ year: "2099" }).commit(),
      b.patch(QA_PROJECT_ID).set({ area: "QA 51 м²" }).commit(),
    ]);
    const concurrent = await client.getDocument(QA_PROJECT_ID);
    fail(failures, "concurrent patches keep document", Boolean(concurrent?._id));
    fail(
      failures,
      "concurrent patches coherent fields",
      concurrent.year === "2099" || concurrent.area === "QA 51 м²"
    );
    fail(
      failures,
      "concurrent identity stable",
      concurrent._id === QA_PROJECT_ID &&
        concurrent.slug?.current === QA_PROJECT_SLUG
    );

    const frameRank = rankAfter(
      baseline.frames[baseline.frames.length - 1]?.orderRank
    );
    await client.delete(`drafts.${QA_FRAME_ID}`).catch(() => undefined);
    const frameDoc = {
      _id: QA_FRAME_ID,
      _type: "inProgressFrame",
      label: "QA кадр",
      titleUa: "QA об’єкт",
      mediaType: "photo",
      frameId: { _type: "slug", current: QA_FRAME_SLUG },
      still: imageField(assets.still),
      objectPosition: "center 30%",
      orderRank: frameRank,
    };
    if (assets.video) frameDoc.video = fileField(assets.video);
    await client.createOrReplace(frameDoc);

    let ip = await publishedInProgress(client);
    fail(
      failures,
      "frame collection +1",
      ip.frames.length === baseline.frames.length + 1
    );
    fail(
      failures,
      "stable frameId",
      ip.frames.some((row) => row.frameId === QA_FRAME_SLUG)
    );

    await client.patch(QA_FRAME_ID).set({ label: "QA кадр RENAMED" }).commit();
    const afterLabel = await client.fetch(
      `*[_id == $id][0]{ _id, label, "frameId": frameId.current }`,
      { id: QA_FRAME_ID }
    );
    fail(failures, "admin label rename keeps doc id", afterLabel._id === QA_FRAME_ID);
    fail(failures, "admin label rename keeps frameId", afterLabel.frameId === QA_FRAME_SLUG);

    const replacedBlinds = [...baseline.board.blinds];
    replacedBlinds[0] = {
      _type: "reference",
      _key: "qa-blind-0",
      _ref: QA_FRAME_ID,
    };
    await client.patch(BOARD_ID).set({ blinds: replacedBlinds }).commit();
    await client.delete(`drafts.${BOARD_ID}`).catch(() => undefined);
    ip = await publishedInProgress(client);
    fail(failures, "board length 4", ip.board?.refs?.length === 4);
    fail(
      failures,
      "board unique refs",
      new Set(ip.board?.refs ?? []).size === 4
    );
    fail(failures, "QA on board slot 0", ip.board?.boardIds?.[0] === QA_FRAME_SLUG);

    const viewerBefore = ip.frames.findIndex((row) => row.frameId === QA_FRAME_SLUG);
    fail(failures, "viewer index before reorder >= 0", viewerBefore >= 0);

    const newFrameRank = rankBefore(baseline.frames[0]?.orderRank);
    await client.patch(QA_FRAME_ID).set({ orderRank: newFrameRank }).commit();
    ip = await publishedInProgress(client);
    fail(failures, "board still refs QA identity", ip.board?.refs?.[0] === QA_FRAME_ID);
    const viewerAfter = ip.frames.findIndex((row) => row.frameId === QA_FRAME_SLUG);
    fail(failures, "viewer index follows collection order", viewerAfter === 0);
    notes.viewerIndex = viewerAfter;
    notes.collectionCount = ip.frames.length;
    notes.videoOnQa = Boolean(assets.video);

    let deleteResult = "unknown";
    try {
      await client.delete(QA_FRAME_ID);
      deleteResult = "deleted";
    } catch (error) {
      deleteResult = `blocked:${error instanceof Error ? error.message : String(error)}`;
    }
    notes.referencedDelete = deleteResult;
    fail(
      failures,
      "strong ref blocks delete or document still resolvable",
      deleteResult.startsWith("blocked") ||
        (await client.fetch(`count(*[_id == $id])`, { id: QA_FRAME_ID })) === 0
    );
    if (deleteResult === "deleted") {
      await client.createOrReplace(frameDoc);
      await client.patch(QA_FRAME_ID).set({ orderRank: newFrameRank }).commit();
    }

    mkdirSync(path.join(ROOT, "tmp"), { recursive: true });
    const state = {
      qaProjectId: QA_PROJECT_ID,
      qaProjectSlug: QA_PROJECT_SLUG,
      qaTitle: "QA — Тестова квартира NEW",
      qaFrameDocId: QA_FRAME_ID,
      qaFrameId: QA_FRAME_SLUG,
      projectCount: baseline.projects.length + 1,
      frameCount: baseline.frames.length + 1,
      galleryCount: 3,
      boardSlot: 0,
      viewerIndex: viewerAfter,
      collectionCount: notes.collectionCount,
      firstProjectSlug: pub[0]?.slug,
      referencedDelete: deleteResult,
    };
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    notes.state = state;
  } finally {
    if (process.env.CMS_QA_DEFER_CLEANUP !== "1") {
      if (baseline) {
        await restoreFromBaseline(client, baseline);
        const check = await assertMatchesBaseline(client, baseline);
        if (check.errors.length) {
          failures.push(`cleanup: ${check.errors.join("; ")}`);
        }
      } else {
        await deleteQaDocuments(client);
      }
    }
  }

  const report = { failures, notes, dataset: WRITE_DATASET };
  mkdirSync(path.join(ROOT, "tmp"), { recursive: true });
  writeFileSync(
    path.join(ROOT, "tmp", "cms-qa-mutate-report.json"),
    JSON.stringify(report, null, 2)
  );
  if (failures.length) {
    abort(`Mutation/GROQ checks failed:\n- ${failures.join("\n- ")}`);
  }
  console.log("[qa-cms] Mutation phase passed.");
  console.log("[qa-cms] write dataset:", client.config().dataset);
}

const phase = process.env.CMS_QA_PHASE || "mutate";
const run = phase === "cleanup" ? cleanupPhase : mutatePhase;
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
