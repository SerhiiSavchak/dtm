/**
 * Measure In-progress media timing under network throttling (local dev).
 * Usage: npm run dev (separate terminal) then node scripts/measure-media-performance.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.MEASURE_BASE_URL || "http://localhost:3000";

const PROFILES = [
  { name: "Fast 4G", download: (1.5 * 1024 * 1024) / 8, upload: (750 * 1024) / 8, latency: 40 },
  { name: "Slow 4G", download: (400 * 1024) / 8, upload: (400 * 1024) / 8, latency: 150 },
  { name: "3G-like", download: (400 * 1024) / 8, upload: (100 * 1024) / 8, latency: 400 },
];

async function measureScenario(profile, mobile, scenario) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCache");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: profile.download,
    uploadThroughput: profile.upload,
    latency: profile.latency,
  });

  let posterMs = null;
  let videoMs = null;
  let bytes = 0;
  let videoBytes = 0;
  const posterSeen = new Set();
  const videoSeen = new Set();
  const videoDetails = [];

  page.on("response", async (res) => {
    const url = res.url();
    let size = Number(res.headers()["content-length"] || 0);
    try {
      if (!size) {
        const body = await res.body().catch(() => null);
        if (body) size = body.length;
      }
    } catch {
      /* ignore */
    }
    if (size > 0) bytes += size;
    if (url.includes("/_next/image") && url.includes("cdn.sanity.io/images")) {
      posterSeen.add(url);
      if (posterMs === null) posterMs = Date.now();
    }
    if (url.includes("cdn.sanity.io/files") && url.endsWith(".mp4")) {
      videoSeen.add(url);
      videoBytes += size;
      videoDetails.push({ url: url.split("/").pop(), sizeMB: (size / 1_000_000).toFixed(2) });
      if (videoMs === null) videoMs = Date.now();
    }
  });

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 90_000 });

  if (scenario === "A") {
    await page.waitForTimeout(3000);
  } else {
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await page
      .locator(".in-progress-board.is-interactive")
      .waitFor({ timeout: 30_000 })
      .catch(() => {});
    if (scenario === "B" && mobile) {
      await page.waitForFunction(
        () => {
          const active = document.querySelector(
            ".in-progress-panel.is-active video source"
          );
          return Boolean(active?.getAttribute("src"));
        },
        undefined,
        { timeout: 35_000 }
      ).catch(() => {});
    } else {
      await page.waitForTimeout(scenario === "B" ? 10000 : 12000);
    }
    if (scenario === "C" || scenario === "D") {
      await page.locator(".in-progress-panel.is-active").click();
      await expectViewer(page, scenario === "D");
    }
  }

  const playback = await page.evaluate(() => {
    const videos = [...document.querySelectorAll(".in-progress-panel video")];
    const playing = videos.filter((v) => !v.paused && v.readyState >= 2).length;
    const posters = [...document.querySelectorAll(".in-progress-panel .media-lqip, .in-progress-panel .media-full.is-shown")].length;
    const activeSrc =
      document
        .querySelector(".in-progress-panel.is-active video source")
        ?.getAttribute("src") ?? "";
    return {
      sources: videos.filter((v) => v.querySelector("source")).length,
      playing,
      posters,
      activeSrc: activeSrc.slice(-40),
    };
  });

  const row = {
    scenario,
    profile: profile.name,
    mobile,
    posterMs: posterMs ? posterMs - t0 : null,
    videoRequestMs: videoMs ? videoMs - t0 : null,
    bytesMB: (bytes / 1_000_000).toFixed(2),
    videoBytesMB: (videoBytes / 1_000_000).toFixed(2),
    uniquePosters: posterSeen.size,
    uniqueVideos: videoSeen.size,
    videoDetails: videoDetails.map((v) => v.url).join(", "),
    ...playback,
  };
  await browser.close();
  return row;
}

async function expectViewer(page, cycleAll) {
  await page.locator(".in-progress-viewer").waitFor({ timeout: 15_000 });
  if (!cycleAll) return;
  for (let i = 0; i < 3; i += 1) {
    const next = page.locator(".in-progress-viewer-hit.is-next");
    if ((await next.count()) === 0) break;
    await next.click();
    await page.waitForTimeout(1500);
  }
}

async function measure(profile, mobile) {
  return measureScenario(profile, mobile, "B");
}

async function main() {
  try {
    const probe = await fetch(BASE);
    if (!probe.ok) throw new Error(`Server not reachable at ${BASE}`);
  } catch {
    console.error(`ABORT: start dev server first: npm run dev\nThen: node scripts/measure-media-performance.mjs`);
    process.exit(1);
  }

  const rows = [];
  const mobileProfile = PROFILES[1]; // Slow 4G
  rows.push(await measureScenario(mobileProfile, true, "A"));
  rows.push(await measureScenario(mobileProfile, true, "B"));
  rows.push(await measureScenario(mobileProfile, true, "C"));
  rows.push(await measureScenario(mobileProfile, true, "D"));
  for (const profile of PROFILES) {
    rows.push(await measure(profile, true));
    rows.push(await measure(profile, false));
  }
  console.log("\n[measure-media] Results (cold, throttled):\n");
  console.table(rows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
