import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

test.describe("In-progress mobile playback policy", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("only active panel loads video source on mobile", async ({ page }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });

    const state = await page.evaluate(() => {
      const panels = [...document.querySelectorAll(".in-progress-panel")];
      return panels.map((panel, i) => ({
        index: i,
        active: panel.classList.contains("is-active"),
        sources: panel.querySelectorAll("video source").length,
        hasSrc: Boolean(
          panel.querySelector<HTMLSourceElement>("video source")?.getAttribute("src")
        ),
      }));
    });

    expect(state.filter((p) => p.hasSrc).length).toBeLessThanOrEqual(1);
    const activeWithSrc = state.find((p) => p.active && p.hasSrc);
    expect(activeWithSrc).toBeTruthy();
  });

  test("active panel autoplays on mobile", async ({ page }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const active = document.querySelector(
              ".in-progress-panel.is-active video"
            ) as HTMLVideoElement | null;
            if (!active) return { playing: false };
            return {
              playing: !active.paused && active.readyState >= 2,
              muted: active.muted,
              playsInline: active.playsInline,
            };
          }),
        { timeout: 25_000 }
      )
      .toMatchObject({ playing: true, muted: true, playsInline: true });
  });

  test("switching active panel loads new video on mobile", async ({ page }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });

    const panels = page.locator(".in-progress-panel");
    await panels.nth(1).click();
    await expect(panels.nth(1)).toHaveClass(/is-active/);

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const active = document.querySelector(
              ".in-progress-panel.is-active video source"
            );
            return active?.getAttribute("src") ?? "";
          }),
        { timeout: 10_000 }
      )
      .not.toBe("");
  });
});

test.describe("In-progress desktop playback policy", () => {
  test.use({ viewport: { width: 1366, height: 900 } });

  test("all four panels may load and autoplay on desktop", async ({ page }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const videos = [
              ...document.querySelectorAll<HTMLVideoElement>(
                ".in-progress-panel video"
              ),
            ];
            return {
              withSource: videos.filter((v) => v.querySelector("source")).length,
              playing: videos.filter(
                (v) => !v.paused && !v.ended && v.readyState >= 2
              ).length,
            };
          }),
        { timeout: 30_000 }
      )
      .toEqual({ withSource: 4, playing: 4 });
  });
});

test.describe("In-progress video not fetched before section approaches", () => {
  test("no in-progress video requests on initial load above fold", async ({
    page,
  }) => {
    const videoReqs: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("cdn.sanity.io/files/") &&
        url.endsWith(".mp4") &&
        req.resourceType() === "media"
      ) {
        videoReqs.push(url);
      }
    });

    await openHome(page, { reducedMotion: false });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#projects")).toBeVisible();

    expect(videoReqs.length).toBe(0);
  });
});
