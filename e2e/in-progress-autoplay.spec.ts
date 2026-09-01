import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

test.describe("In-progress four-panel video autoplay", () => {
  test("all visible panels autoplay muted when board is on-screen", async ({
    page,
  }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 12_000,
    });

    const panels = page.locator(".in-progress-panel");
    await expect(panels).toHaveCount(4);

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const videos = [
            ...document.querySelectorAll<HTMLVideoElement>(
              ".in-progress-panel video"
            ),
          ];
          if (videos.length < 4) return { count: videos.length, playing: 0 };
          return {
            count: videos.length,
            playing: videos.filter((v) => !v.paused && !v.ended && v.readyState >= 2)
              .length,
            muted: videos.every((v) => v.muted),
            playsInline: videos.every((v) => v.playsInline),
            noControls: videos.every((v) => !v.controls),
          };
        });
      }, { timeout: 25_000 })
      .toMatchObject({
        count: 4,
        playing: 4,
        muted: true,
        playsInline: true,
        noControls: true,
      });
  });

  test("videos pause when board is scrolled far offscreen", async ({ page }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 12_000,
    });

    await expect
      .poll(async () => {
        return page.evaluate(
          () =>
            [...document.querySelectorAll<HTMLVideoElement>(".in-progress-panel video")]
              .filter((v) => !v.paused).length
        );
      }, { timeout: 25_000 })
      .toBe(4);

    await page.locator("#faq").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    await expect
      .poll(async () => {
        return page.evaluate(
          () =>
            [...document.querySelectorAll<HTMLVideoElement>(".in-progress-panel video")]
              .filter((v) => !v.paused).length
        );
      }, { timeout: 8_000 })
      .toBe(0);
  });
});
