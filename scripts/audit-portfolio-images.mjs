/**
 * Focused Portfolio image audit on cold mobile viewport (390×844).
 * Usage: MEASURE_BASE_URL=http://localhost:3000 node scripts/audit-portfolio-images.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.MEASURE_BASE_URL || "http://localhost:3000";

async function audit() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCache");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

  const images = [];

  cdp.on("Network.responseReceived", (evt) => {
    const { response, type } = evt;
    const url = response.url;
    if (
      type === "Image" ||
      (url.includes("/_next/image") && url.includes("cdn.sanity.io"))
    ) {
      images.push({
        url,
        mime: response.mimeType,
        status: response.status,
        encoded: response.encodedDataLength || 0,
        fromDiskCache: response.fromDiskCache,
        fromServiceWorker: response.fromServiceWorker,
      });
    }
  });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 90_000 });

  const leadCard = await page.evaluate(() => {
    const img = document.querySelector(
      "#projects .portfolio-lead img, #projects .portfolio-card:first-of-type img"
    );
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    return {
      cssW: Math.round(rect.width),
      cssH: Math.round(rect.height),
      loading: img.getAttribute("loading"),
      fetchPriority: img.getAttribute("fetchpriority"),
      src: img.getAttribute("src")?.slice(0, 120),
    };
  });

  const cardCount = await page.locator("#projects .portfolio-card, #projects [class*='portfolio']").count();

  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);

  const visibleCards = await page.evaluate(() => {
    return [...document.querySelectorAll("#projects img")].slice(0, 8).map((img) => {
      const rect = img.getBoundingClientRect();
      const src = img.getAttribute("src") || "";
      const wMatch = src.match(/w=(\d+)/);
      return {
        cssW: Math.round(rect.width),
        requestedW: wMatch ? Number(wMatch[1]) : null,
        loading: img.getAttribute("loading"),
        fetchPriority: img.getAttribute("fetchpriority"),
        src: src.slice(0, 100),
      };
    });
  });

  const firstProject = page.locator("#projects a, #projects [role='link']").first();
  if ((await firstProject.count()) > 0) {
    await firstProject.click();
    await page.waitForTimeout(3000);
  }

  const dossierImages = await page.evaluate(() => {
    return [...document.querySelectorAll(".project-dossier img, [class*='dossier'] img")].slice(0, 5).map((img) => {
      const rect = img.getBoundingClientRect();
      const src = img.getAttribute("src") || "";
      const wMatch = src.match(/w=(\d+)/);
      return {
        cssW: Math.round(rect.width),
        requestedW: wMatch ? Number(wMatch[1]) : null,
        loading: img.getAttribute("loading"),
        src: src.slice(0, 100),
      };
    });
  });

  const sanityImages = images.filter((i) => i.url.includes("cdn.sanity.io") || i.url.includes("/_next/image"));
  const totalBytes = sanityImages.reduce((s, i) => s + i.encoded, 0);
  const oversized = visibleCards.filter(
    (c) => c.requestedW && c.cssW && c.requestedW > c.cssW * 3
  );

  await browser.close();

  const report = {
    base: BASE,
    totalImageRequests: sanityImages.length,
    totalImageKB: Math.round(totalBytes / 1024),
    leadCard,
    visibleCards,
    dossierImages,
    oversizedCount: oversized.length,
    issues: [],
  };

  if (oversized.length > 0) {
    report.issues.push(`${oversized.length} portfolio cards request width >3× CSS size`);
  }

  const duplicateUrls = new Set();
  const dupes = [];
  for (const img of sanityImages) {
    const key = img.url.split("&")[0];
    if (duplicateUrls.has(key)) dupes.push(key);
    duplicateUrls.add(key);
  }
  if (dupes.length) report.issues.push(`${dupes.length} duplicate image URLs`);

  console.log("\n[portfolio-audit] Cold mobile 390×844:\n");
  console.log(JSON.stringify(report, null, 2));
  return report;
}

audit().catch((e) => {
  console.error(e);
  process.exit(1);
});
