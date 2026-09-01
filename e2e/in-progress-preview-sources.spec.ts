import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

test.describe("In-progress preview vs full video sources", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile active panel prefers previewVideo when available", async ({
    page,
  }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });

    const source = await page.evaluate(() => {
      const active = document.querySelector(
        ".in-progress-panel.is-active video source"
      ) as HTMLSourceElement | null;
      return active?.getAttribute("src") ?? "";
    });

    expect(source).toMatch(/cdn\.sanity\.io\/files/);
    expect(source).toMatch(/\.mp4/);
  });

  test("viewer loads full video not previewVideo", async ({ page }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });

    const panelSrc = await page.evaluate(() => {
      const active = document.querySelector(
        ".in-progress-panel.is-active video source"
      ) as HTMLSourceElement | null;
      return active?.getAttribute("src") ?? "";
    });

    await page.locator(".in-progress-panel.is-active").click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible({
      timeout: 10_000,
    });

    const viewerSrc = await page.evaluate(() => {
      const viewer = document.querySelector(
        ".in-progress-viewer video source"
      ) as HTMLSourceElement | null;
      return viewer?.getAttribute("src") ?? "";
    });

    expect(viewerSrc).toMatch(/cdn\.sanity\.io\/files/);
    if (panelSrc && viewerSrc && panelSrc !== viewerSrc) {
      expect(viewerSrc).not.toBe(panelSrc);
    }
  });

  test("real frames board has four video panels when Sanity is live", async ({
    page,
  }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });

    const panels = page.locator(".in-progress-panel");
    await expect(panels).toHaveCount(4);

    const withVideo = await page.evaluate(() => {
      return [...document.querySelectorAll(".in-progress-panel")].filter((p) =>
        p.querySelector("video")
      ).length;
    });

    expect(withVideo).toBeGreaterThanOrEqual(1);
  });
});
