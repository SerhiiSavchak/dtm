/**
 * Migrate hardcoded Portfolio (data/projects.ts) into Sanity dataset
 * "development" only. No dataset CLI override. No production writes.
 */
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { register } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { LexoRank } from "lexorank";
import { getCliClient } from "sanity/cli";

const WRITE_DATASET = "development";
const TEST_IDS = [
  "dtm-test-project-01",
  "dtm-test-project-02",
  "dtm-test-project-03",
];
const CATEGORIES = new Set(["apartment", "house", "commercial"]);
const SPANS = new Set(["large", "tall", "wide", "small"]);
const FITS = new Set(["cover", "contain"]);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

register(pathToFileURL(path.join(ROOT, "scripts/ts-ext-hooks.mjs")).href, import.meta.url);

const PORTFOLIO_PROJECTS_QUERY = `
*[_type == "project"
  && !(_id in path("drafts.**"))
  && defined(slug.current)
  && defined(cover.asset)
  && count(gallery) > 0
] | order(orderRank asc) {
  _id,
  titleUa,
  titleEn,
  "slug": slug.current,
  category,
  locationKey,
  descriptionUa,
  descriptionEn,
  area,
  workTypeUa,
  workTypeEn,
  durationUa,
  durationEn,
  year,
  coverPosition,
  span,
  orderRank,
  "coverUrl": cover.asset->url,
  "coverAssetId": cover.asset._ref,
  "coverLqip": cover.asset->metadata.lqip,
  gallery[] {
    fit,
    objectPosition,
    thumbPosition,
    "src": image.asset->url,
    "assetId": image.asset._ref,
    "lqip": image.asset->metadata.lqip,
    "video": video.asset->url
  }
}
`;

function abort(message) {
  console.error(`\nABORT: ${message}\nNo further Sanity mutations will be sent.\n`);
  process.exit(1);
}

function loadEnvLocal() {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function assertDevelopment(label, dataset) {
  if (dataset !== WRITE_DATASET) {
    abort(
      `${label} is ${JSON.stringify(dataset)}, expected exactly "${WRITE_DATASET}". This migration cannot write to production or any other dataset.`
    );
  }
}

function publicFileFromWebPath(webPath) {
  if (!webPath || typeof webPath !== "string" || !webPath.startsWith("/")) {
    return { webPath, abs: null, ok: false, reason: "path is not a site-root URL" };
  }
  const rel = webPath.replace(/^\//, "");
  const abs = path.join(ROOT, "public", rel);
  if (!existsSync(abs)) {
    return { webPath, abs, ok: false, reason: `missing file public/${rel}` };
  }
  return { webPath, abs, ok: true, reason: null };
}

function documentId(slug) {
  return `dtm-project-${slug}`;
}

function paragraphs(value) {
  if (!value) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function norm(value) {
  return (value ?? "").trim();
}

function imageField(assetId) {
  return {
    _type: "image",
    asset: { _type: "reference", _ref: assetId },
  };
}

function ranksForCount(count) {
  let rank = LexoRank.min().genNext().genNext();
  const values = [];
  for (let i = 0; i < count; i += 1) {
    values.push(rank.toString());
    rank = LexoRank.parse(rank.toString()).genNext().genNext();
  }
  return values;
}

function sha1File(abs) {
  return createHash("sha1").update(readFileSync(abs)).digest("hex");
}

function isSanityAssetRef(ref) {
  return typeof ref === "string" && (ref.startsWith("image-") || ref.startsWith("file-"));
}

function isSanityCdnUrl(url) {
  return typeof url === "string" && /^https:\/\/cdn\.sanity\.io\//.test(url);
}

async function uploadOrReuseImage(client, abs, cache, stats) {
  if (cache.has(abs)) {
    stats.reused += 1;
    return cache.get(abs);
  }
  const hash = sha1File(abs);
  const existing = await client.fetch(
    `*[_type == "sanity.imageAsset" && sha1hash == $hash][0]._id`,
    { hash }
  );
  if (existing) {
    cache.set(abs, existing);
    stats.reused += 1;
    return existing;
  }
  const filename = `dtm-portfolio-${path.basename(abs)}`;
  const asset = await client.assets.upload("image", createReadStream(abs), {
    filename,
  });
  cache.set(abs, asset._id);
  stats.uploaded += 1;
  return asset._id;
}

function preflight(projects) {
  const errors = [];
  const slugs = new Set();

  if (!Array.isArray(projects) || projects.length === 0) {
    errors.push("Hardcoded projects[] is empty.");
    return errors;
  }

  for (const project of projects) {
    const slug = project?.slug;
    const label = slug || "(missing-slug)";
    if (!slug) errors.push(`Project ${label} cannot be migrated because slug is missing.`);
    if (!project?.title) {
      errors.push(`Project ${label} cannot be migrated because title is missing.`);
    }
    if (slug) {
      if (slugs.has(slug)) {
        errors.push(`Project ${label} cannot be migrated because slug is duplicated.`);
      }
      slugs.add(slug);
    }
    if (!CATEGORIES.has(project?.category)) {
      errors.push(
        `Project ${label} cannot be migrated because category ${JSON.stringify(project?.category)} is invalid.`
      );
    }
    if (!SPANS.has(project?.span)) {
      errors.push(
        `Project ${label} cannot be migrated because span ${JSON.stringify(project?.span)} is invalid.`
      );
    }
    if (project?.locationKey && project.locationKey !== "lviv") {
      errors.push(
        `Project ${label} cannot be migrated because locationKey ${JSON.stringify(project.locationKey)} is not representable.`
      );
    }
    const cover = publicFileFromWebPath(project?.cover);
    if (!cover.ok) {
      errors.push(
        `Project ${label} cannot be migrated because cover ${cover.reason}.`
      );
    }
    if (!norm(project?.coverPosition)) {
      errors.push(
        `Project ${label} cannot be migrated because coverPosition is missing.`
      );
    }
    if (!Array.isArray(project?.media) || project.media.length === 0) {
      errors.push(
        `Project ${label} cannot be migrated because gallery/media is empty.`
      );
      continue;
    }
    project.media.forEach((item, index) => {
      const img = publicFileFromWebPath(item?.src);
      if (!img.ok) {
        errors.push(
          `Project ${label} cannot be migrated because gallery[${index}] ${img.reason}.`
        );
      }
      if (!FITS.has(item?.fit)) {
        errors.push(
          `Project ${label} cannot be migrated because gallery[${index}] fit ${JSON.stringify(item?.fit)} is invalid.`
        );
      }
      if (!norm(item?.objectPosition)) {
        errors.push(
          `Project ${label} cannot be migrated because gallery[${index}] objectPosition is missing.`
        );
      }
      if (item?.video) {
        const video = publicFileFromWebPath(item.video);
        if (!video.ok) {
          errors.push(
            `Project ${label} cannot be migrated because gallery[${index}] video ${video.reason}.`
          );
        }
      }
    });
  }

  return errors;
}

function compareProject(source, stored) {
  const fails = [];
  const check = (field, a, b) => {
    if (a !== b) fails.push(`${field}: source=${JSON.stringify(a)} sanity=${JSON.stringify(b)}`);
  };

  check("slug", source.slug, stored.slug);
  check("title", source.title, stored.titleUa);
  check("category", source.category, stored.category);
  check("locationKey", source.locationKey ?? "", stored.locationKey ?? "");
  check("area", source.area ?? "", stored.area ?? "");
  check("workType", source.workType ?? "", stored.workTypeUa ?? "");
  check("duration", source.duration ?? "", stored.durationUa ?? "");
  check("year", source.year ?? "", stored.year ?? "");
  check("span", source.span, stored.span);
  check("coverPosition", norm(source.coverPosition), norm(stored.coverPosition));

  const sourceParas = paragraphs(source.description);
  const storedParas = paragraphs(stored.descriptionUa);
  check("description.length", sourceParas.length, storedParas.length);
  sourceParas.forEach((para, i) => check(`description[${i}]`, para, storedParas[i] ?? ""));

  if (!stored.coverUrl || !isSanityCdnUrl(stored.coverUrl)) {
    fails.push(`cover is not a Sanity CDN asset (${stored.coverUrl})`);
  }
  if (!isSanityAssetRef(stored.coverAssetId)) {
    fails.push(`cover asset ref invalid (${stored.coverAssetId})`);
  }

  const gallery = stored.gallery ?? [];
  check("gallery.count", source.media.length, gallery.length);
  source.media.forEach((item, i) => {
    const g = gallery[i] || {};
    check(`gallery[${i}].fit`, item.fit, g.fit);
    check(`gallery[${i}].objectPosition`, norm(item.objectPosition), norm(g.objectPosition));
    check(
      `gallery[${i}].thumbPosition`,
      norm(item.thumbPosition ?? ""),
      norm(g.thumbPosition ?? "")
    );
    if (!isSanityCdnUrl(g.src)) {
      fails.push(`gallery[${i}].src is not a Sanity CDN url (${g.src})`);
    }
    if (!isSanityAssetRef(g.assetId)) {
      fails.push(`gallery[${i}].assetId invalid (${g.assetId})`);
    }
    if (item.video) {
      if (!g.video) fails.push(`gallery[${i}].video missing in Sanity`);
    } else if (g.video) {
      fails.push(`gallery[${i}].video unexpected in Sanity`);
    }
  });

  if (stored.titleEn) fails.push("titleEn should be empty");
  if (stored.workTypeEn) fails.push("workTypeEn should be empty");
  if (stored.durationEn) fails.push("durationEn should be empty");
  if (paragraphs(stored.descriptionEn).length > 0) {
    fails.push("descriptionEn should be empty");
  }
  if (!stored.orderRank) fails.push("orderRank is null/empty");

  return fails;
}

async function main() {
  console.log("[migrate] DTM Portfolio → Sanity development\n");

  if (process.argv.some((arg) => arg === "--dataset" || arg.startsWith("--dataset="))) {
    abort("This migration does not accept dataset overrides.");
  }

  loadEnvLocal();

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
  const configuredDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";

  console.log(`[migrate] Project: ${projectId || "(missing)"}`);
  console.log(`[migrate] Dataset: ${configuredDataset || "(missing)"}`);
  if (!projectId) abort("NEXT_PUBLIC_SANITY_PROJECT_ID is missing.");
  assertDevelopment("NEXT_PUBLIC_SANITY_DATASET", configuredDataset);
  console.log("[migrate] Safety check passed\n");

  const { projects } = await import(
    pathToFileURL(path.join(ROOT, "data/projects.ts")).href
  );

  console.log(`[migrate] Source inventory: ${projects.length} projects`);
  projects.forEach((project, index) => {
    console.log(
      `  ${index + 1}. ${project.slug}  span=${project.span}  gallery=${project.media.length}`
    );
  });

  console.log("\n[migrate] Preflight...");
  const preflightErrors = preflight(projects);
  if (preflightErrors.length > 0) {
    preflightErrors.forEach((line) => console.error(`  FAIL  ${line}`));
    abort("Preflight failed. Zero mutations were sent.");
  }
  console.log("  PASS  all hardcoded projects are migratable\n");

  let cliClient;
  try {
    cliClient = getCliClient({ apiVersion: "2025-08-22" });
  } catch (error) {
    abort(
      `Sanity CLI client is unavailable (${error instanceof Error ? error.message : error}). Run: npx sanity login`
    );
  }

  const cliDataset = cliClient.config().dataset;
  if (cliDataset) assertDevelopment("Sanity CLI client dataset", cliDataset);

  const token = process.env.SANITY_AUTH_TOKEN || cliClient.config().token;
  if (!token) abort("No Sanity auth token. Run: npx sanity login");

  const client = cliClient.withConfig({
    projectId,
    dataset: WRITE_DATASET,
    apiVersion: "2025-08-22",
    useCdn: false,
    token,
    perspective: "raw",
  });

  assertDevelopment("write client dataset", client.config().dataset);
  if (client.config().projectId !== projectId) {
    abort("Write client project ID does not match NEXT_PUBLIC_SANITY_PROJECT_ID.");
  }

  const uniqueAbs = new Set();
  for (const project of projects) {
    uniqueAbs.add(publicFileFromWebPath(project.cover).abs);
    for (const item of project.media) {
      uniqueAbs.add(publicFileFromWebPath(item.src).abs);
    }
  }
  console.log(`[migrate] Unique local images: ${uniqueAbs.size}`);
  console.log("[migrate] Portfolio videos: 0 (none in data/projects.ts)");

  const assetCache = new Map();
  const stats = { uploaded: 0, reused: 0 };
  const ranks = ranksForCount(projects.length);
  const migratedIds = projects.map((project) => documentId(project.slug));

  for (const [index, project] of projects.entries()) {
    const id = documentId(project.slug);
    console.log(
      `[migrate] ${index + 1}/${projects.length} ${project.slug} → ${id}`
    );

    const coverAbs = publicFileFromWebPath(project.cover).abs;
    const coverAssetId = await uploadOrReuseImage(client, coverAbs, assetCache, stats);

    const gallery = [];
    for (const [gIndex, item] of project.media.entries()) {
      const abs = publicFileFromWebPath(item.src).abs;
      const assetId = await uploadOrReuseImage(client, abs, assetCache, stats);
      gallery.push({
        _type: "projectMedia",
        _key: `${project.slug}-g${gIndex + 1}`,
        image: imageField(assetId),
        fit: item.fit,
        objectPosition: item.objectPosition,
        ...(item.thumbPosition ? { thumbPosition: item.thumbPosition } : {}),
      });
    }

    const doc = {
      _id: id,
      _type: "project",
      titleUa: project.title,
      slug: { _type: "slug", current: project.slug },
      category: project.category,
      ...(project.locationKey ? { locationKey: project.locationKey } : {}),
      descriptionUa: paragraphs(project.description),
      ...(project.area ? { area: project.area } : {}),
      ...(project.workType ? { workTypeUa: project.workType } : {}),
      ...(project.duration ? { durationUa: project.duration } : {}),
      ...(project.year ? { year: project.year } : {}),
      span: project.span,
      coverPosition: project.coverPosition,
      cover: imageField(coverAssetId),
      gallery,
      orderRank: ranks[index],
    };

    await client.delete(`drafts.${id}`).catch(() => undefined);
    await client.createOrReplace(doc);
    console.log(`  wrote orderRank=${ranks[index]} gallery=${gallery.length}`);
  }

  console.log(
    `\n[migrate] Assets: uploaded=${stats.uploaded} reused=${stats.reused} uniqueLocal=${uniqueAbs.size}`
  );

  const storedById = await client.fetch(
    `*[_type == "project" && _id in $ids] | order(orderRank asc) {
      _id,
      titleUa,
      titleEn,
      "slug": slug.current,
      category,
      locationKey,
      descriptionUa,
      descriptionEn,
      area,
      workTypeUa,
      workTypeEn,
      durationUa,
      durationEn,
      year,
      coverPosition,
      span,
      orderRank,
      "coverUrl": cover.asset->url,
      "coverAssetId": cover.asset._ref,
      gallery[] {
        fit,
        objectPosition,
        thumbPosition,
        "src": image.asset->url,
        "assetId": image.asset._ref,
        "video": video.asset->url
      }
    }`,
    { ids: migratedIds }
  );

  if (storedById.length !== projects.length) {
    abort(
      `Read-back count ${storedById.length} !== source count ${projects.length}. TEST documents were not deleted.`
    );
  }

  console.log("\n[migrate] Source ↔ Sanity");
  let compareFailed = false;
  const storedSlugs = storedById.map((row) => row.slug);
  const sourceSlugs = projects.map((project) => project.slug);
  if (JSON.stringify(storedSlugs) !== JSON.stringify(sourceSlugs)) {
    console.error(
      `  FAIL  order ${sourceSlugs.join(" → ")} vs ${storedSlugs.join(" → ")}`
    );
    compareFailed = true;
  } else {
    console.log(`  PASS  order  ${sourceSlugs.join(" → ")}`);
  }

  for (const project of projects) {
    const row = storedById.find((item) => item._id === documentId(project.slug));
    const fails = row ? compareProject(project, row) : ["document missing"];
    if (fails.length === 0) {
      console.log(`  PASS  ${project.slug}`);
    } else {
      compareFailed = true;
      console.error(`  FAIL  ${project.slug}`);
      fails.forEach((line) => console.error(`        ${line}`));
    }
  }

  const nullRanks = storedById.filter((row) => !row.orderRank);
  if (nullRanks.length > 0) {
    compareFailed = true;
    console.error("  FAIL  null orderRank", nullRanks.map((row) => row._id));
  }

  if (compareFailed) {
    abort("Sanity read-back did not match source. TEST documents were not deleted.");
  }

  const testsStillThere = await client.fetch(
    `*[_id in $ids]{_id, "slug": slug.current}`,
    { ids: TEST_IDS }
  );
  console.log(
    `\n[migrate] TEST documents still present before cleanup: ${testsStillThere.length}`
  );

  for (const id of TEST_IDS) {
    await client.delete(id).catch(() => undefined);
    await client.delete(`drafts.${id}`).catch(() => undefined);
  }
  const testsAfter = await client.fetch(`count(*[_id in $ids])`, { ids: TEST_IDS });
  if (testsAfter !== 0) {
    abort(`TEST documents still exist after cleanup (${testsAfter}).`);
  }
  console.log("[migrate] Deleted TEST 01 / TEST 02 / TEST 03 (exact IDs only)");

  const publishedClient = client.withConfig({ perspective: "published" });
  const layerDocs = await publishedClient.fetch(PORTFOLIO_PROJECTS_QUERY);
  const mappedSlugs = (layerDocs ?? [])
    .map((doc) => doc.slug)
    .filter(Boolean);
  const hardcodedWouldBeUsed = mappedSlugs.length === 0;

  console.log("\n[migrate] Frontend data layer (same GROQ as getPortfolioProjects)");
  console.log(`  Sanity path: ${hardcodedWouldBeUsed ? "INACTIVE (would fallback)" : "ACTIVE"}`);
  console.log(`  Hardcoded fallback: ${hardcodedWouldBeUsed ? "ACTIVE" : "inactive"}`);
  console.log(`  Count: ${mappedSlugs.length}`);
  console.log(`  Ordered slugs: ${mappedSlugs.join(" → ")}`);

  if (hardcodedWouldBeUsed) {
    abort("Frontend GROQ returned zero projects; hardcoded fallback would activate.");
  }
  if (mappedSlugs.length !== sourceSlugs.length) {
    abort(
      `Frontend count ${mappedSlugs.length} !== source ${sourceSlugs.length}.`
    );
  }
  if (JSON.stringify(mappedSlugs) !== JSON.stringify(sourceSlugs)) {
    abort("Frontend ordered slugs do not match data/projects.ts.");
  }
  if (mappedSlugs.some((slug) => slug.startsWith("test-"))) {
    abort("TEST slugs still appear in the published Portfolio query.");
  }

  console.log("\n[migrate] Write dataset confirmed:", client.config().dataset);
  console.log("[migrate] 0 mutations sent to production");
  console.log("[migrate] Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
