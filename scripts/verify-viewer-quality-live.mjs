/**
 * Verify panel uses previewVideo and viewer uses full video on live page.
 */
import { chromium } from "playwright";

const BASE = process.env.MEASURE_BASE_URL || "http://localhost:3000";
const PREVIEW_HASHES = [
  "6810b4dea56c98ab38b6f3f5f46789cb4504e480",
  "cfe5cfd7f0f55ad5501f8174e3858bc84da2b4c6",
  "d22d6a83ea2543fd76f75ee41bece01f7ae879af",
  "10af6c0c982ad277da85ff56e7197e267b45a7c1",
];
const FULL_HASHES = [
  "2ca2e3168b63cb3a8afde0c7207646145fac64a3",
  "a685b03a59aaf0ea83a62f3b1503c7a113834e8b",
  "eb484e2e8c6979c473532c110bd891a7c2e3d548",
  "cb79e32243005a08e18806bd467f5bf7d84e8bd4",
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  const viewerUrls = [];

  page.on("response", (res) => {
    const url = res.url();
    if (url.includes(".mp4")) viewerUrls.push(url);
  });

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.locator("#in-progress").scrollIntoViewIfNeeded();
  await page.locator(".in-progress-board.is-interactive").waitFor({ timeout: 20000 });

  await page.waitForFunction(
    () =>
      Boolean(
        document.querySelector(".in-progress-panel.is-active video source")?.getAttribute("src")
      ),
    undefined,
    { timeout: 20000 }
  );

  const panelSrc = await page.evaluate(
    () =>
      document
        .querySelector(".in-progress-panel.is-active video source")
        ?.getAttribute("src") ?? ""
  );

  await page.locator(".in-progress-panel.is-active").click();
  await page.locator(".in-progress-viewer").waitFor({ timeout: 10000 });

  await page.waitForFunction(
    () =>
      Boolean(
        document.querySelector(".in-progress-viewer video source")?.getAttribute("src")
      ),
    undefined,
    { timeout: 20000 }
  );

  const viewerSrc = await page.evaluate(
    () =>
      document.querySelector(".in-progress-viewer video source")?.getAttribute("src") ?? ""
  );

  for (let i = 0; i < 3; i++) {
    const next = page.locator(".in-progress-viewer-hit.is-next");
    if ((await next.count()) === 0) break;
    await next.click();
    await page.waitForTimeout(2000);
  }

  await browser.close();

  const panelIsPreview = PREVIEW_HASHES.some((h) => panelSrc.includes(h));
  const panelIsFull = FULL_HASHES.some((h) => panelSrc.includes(h));
  const viewerIsFull = FULL_HASHES.some((h) => viewerSrc.includes(h));
  const viewerIsPreview = PREVIEW_HASHES.some((h) => viewerSrc.includes(h));

  console.log(JSON.stringify({
    panelSrc,
    viewerSrc,
    panelIsPreview,
    panelIsFull,
    viewerIsFull,
    viewerIsPreview,
    allViewerMp4: [...new Set(viewerUrls.filter((u) => u.includes(".mp4")))],
    pass:
      panelIsPreview &&
      !panelIsFull &&
      viewerIsFull &&
      !viewerIsPreview &&
      panelSrc !== viewerSrc,
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
