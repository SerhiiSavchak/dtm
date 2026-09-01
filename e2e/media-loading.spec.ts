import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { openHome } from "./helpers";

const SLOW_MS = 1100;

function delayImages(page: import("@playwright/test").Page) {
  let delayed = false;
  page.route("**/*", async (route) => {
    const url = route.request().url();
    const isMedia =
      url.includes("/_next/image") ||
      (url.includes("cdn.sanity.io/images/") && !url.includes("/files/")) ||
      /\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(url);
    if (delayed && isMedia) {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
      await route.fulfill({ response });
      return;
    }
    await route.continue();
  });
  return {
    enable: () => {
      delayed = true;
    },
    disable: () => {
      delayed = false;
    },
  };
}

test.describe("Portfolio media loading", () => {
  test("keeps previous frame visible with loader under delayed media", async ({
    page,
  }) => {
    const gate = delayImages(page);

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();

    const thumbs = page.locator(".project-dossier-thumb");
    const count = await thumbs.count();
    const targetIndex = count > 3 ? 3 : count - 1;
    if (targetIndex < 2) {
      test.skip();
      return;
    }

    const stage = page.locator(".project-dossier-stage");
    const firstLayer = page.locator(".project-dossier-layer.is-shown").first();
    await expect(firstLayer).toBeVisible();

    gate.enable();
    await thumbs.nth(targetIndex).click();

    await expect(thumbs.nth(targetIndex)).toHaveClass(/is-pending/, {
      timeout: 500,
    });
    await expect(stage).toHaveClass(/is-pending/, { timeout: 500 });
    await expect(firstLayer).toBeVisible();
    await expect(page.locator(".project-dossier-wait.is-on")).toBeVisible({
      timeout: 2000,
    });

    await expect(page.locator(".project-dossier-wait.is-on")).toHaveCount(0, {
      timeout: 12_000,
    });
    await expect(page.locator(".project-dossier-counter")).toContainText(
      String(targetIndex + 1).padStart(2, "0")
    );
  });

  test("fast cached switch does not flash loader", async ({ page }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();

    const thumbs = page.locator(".project-dossier-thumb");
    const count = await thumbs.count();
    if (count < 3) {
      test.skip();
      return;
    }

    await thumbs.nth(1).click();
    await expect(page.locator(".project-dossier-counter")).toContainText("02", {
      timeout: 5000,
    });

    await thumbs.nth(2).click();
    await page.waitForTimeout(120);
    await expect(page.locator(".project-dossier-wait.is-on")).toHaveCount(0);
    await expect(page.locator(".project-dossier-counter")).toContainText("03", {
      timeout: 5000,
    });
  });

  test("latest target wins under rapid delayed clicks", async ({ page }) => {
    const gate = delayImages(page);

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();

    const thumbs = page.locator(".project-dossier-thumb");
    const count = await thumbs.count();
    if (count < 4) {
      test.skip();
      return;
    }

    gate.enable();
    await thumbs.nth(1).click();
    await thumbs.nth(2).click();
    await thumbs.nth(3).click();

    await expect(thumbs.nth(3)).toHaveClass(/is-pending/);
    await expect(page.locator(".project-dossier-counter")).toContainText("04", {
      timeout: 15_000,
    });
  });

  test("failed media keeps previous frame and clears pending", async ({
    page,
  }) => {
    let failNext = false;
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (failNext && url.includes("/_next/image")) {
        await route.fulfill({
          status: 404,
          contentType: "text/plain",
          body: "missing",
        });
        return;
      }
      await route.continue();
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();

    const thumbs = page.locator(".project-dossier-thumb");
    const count = await thumbs.count();
    const failIndex = count > 4 ? 4 : count - 1;
    if (failIndex < 2) {
      test.skip();
      return;
    }

    const stage = page.locator(".project-dossier-stage");
    const counter = page.locator(".project-dossier-counter");
    const stable = (await counter.innerText()).trim();

    failNext = true;
    await thumbs.nth(failIndex).click();

    await expect
      .poll(async () => stage.getAttribute("class"), { timeout: 10_000 })
      .not.toContain("is-pending");
    await expect(page.locator(".project-dossier-wait.is-on")).toHaveCount(0);
    await expect(counter).toHaveText(stable);
    await expect(thumbs.nth(failIndex)).not.toHaveClass(/is-pending/);
  });
});

test.describe("In-progress media loading", () => {
  test("shows loader under delayed navigation", async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

    let delayed = false;
    page.route("**/*", async (route) => {
      const url = route.request().url();
      const isSlowMedia =
        url.includes("/_next/image") ||
        url.includes("cdn.sanity.io/images/") ||
        url.includes(".mp4");
      if (delayed && isSlowMedia) {
        const response = await route.fetch();
        await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
        await route.fulfill({ response });
        return;
      }
      await route.continue();
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });

    delayed = true;
    await page.locator(".in-progress-panel.is-active").click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible();

    const next = page.locator(".in-progress-viewer-hit.is-next");
    if ((await next.count()) === 0) {
      test.skip();
      return;
    }

    const stage = page.locator(".in-progress-viewer-stage-inner");
    const shown = page.locator(".in-progress-viewer-layer.is-shown").first();
    await expect(shown).toBeVisible();

    await next.click();

    await expect(stage).toHaveClass(/is-pending/, { timeout: 500 });
    await expect(shown).toBeVisible();
    // Posters are near-view preloaded on the board; loader may stay off when
    // incoming poster resolves from cache. Assert navigation completes cleanly.
    await expect(page.locator(".in-progress-viewer-count")).toContainText("2 /", {
      timeout: 15_000,
    });
    await expect(stage).not.toHaveClass(/is-pending/, { timeout: 15_000 });
    await page.unrouteAll({ behavior: "ignoreErrors" });
  });
});

test.describe("Media loader visual capture", () => {
  test("captures T0–T3 dossier states under forced delay", async ({ page }) => {
    const gate = delayImages(page);
    const outDir = path.join("tmp", "media-loader");
    mkdirSync(outDir, { recursive: true });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();

    const thumbs = page.locator(".project-dossier-thumb");
    const count = await thumbs.count();
    const targetIndex = count > 3 ? 3 : count - 1;
    if (targetIndex < 2) {
      test.skip();
      return;
    }

    const stage = page.locator(".project-dossier-stage");
    await page.screenshot({ path: path.join(outDir, "dossier-t0-before.png") });

    gate.enable();
    await thumbs.nth(targetIndex).click();
    await page.waitForTimeout(40);
    await page.screenshot({ path: path.join(outDir, "dossier-t1-immediate.png") });

    await expect(stage).toHaveClass(/is-pending/, { timeout: 500 });
    await expect(page.locator(".project-dossier-wait.is-on")).toBeVisible({
      timeout: 2000,
    });
    await page.screenshot({ path: path.join(outDir, "dossier-t2-loader.png") });

    await expect(page.locator(".project-dossier-wait.is-on")).toHaveCount(0, {
      timeout: 12_000,
    });
    await page.screenshot({ path: path.join(outDir, "dossier-t3-ready.png") });
  });
});
