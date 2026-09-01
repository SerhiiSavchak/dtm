import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

const isNextImage = (url: string) => url.includes("/_next/image");
const isSanityStill = (url: string) =>
  url.includes("cdn.sanity.io/images/") && !url.includes("/files/");

async function waitRevealed(frame: import("@playwright/test").Locator) {
  await expect(frame).toHaveAttribute("data-load-state", "revealed", {
    timeout: 20_000,
  });
  await expect(frame.locator(".media-lqip")).toHaveCount(0);
  await expect(frame.locator(".media-full.is-shown")).toBeVisible();
}

test.describe("MediaImage reliability", () => {
  test("CASE A: normal success blur→image", async ({ page }) => {
    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const frame = page.locator("#projects .media-frame").first();
    await waitRevealed(frame);
  });

  test("CASE B: delayed success resolves without permanent pending", async ({
    page,
    context,
  }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

    let delayed = false;
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (
        delayed &&
        (isNextImage(url) || isSanityStill(url))
      ) {
        const response = await route.fetch();
        await new Promise((r) => setTimeout(r, 900));
        await route.fulfill({ response });
        return;
      }
      await route.continue();
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();

    const thumbs = page.locator(".project-dossier-thumb");
    if ((await thumbs.count()) < 3) {
      test.skip();
      return;
    }

    delayed = true;
    await thumbs.nth(2).click();
    const stage = page.locator(".project-dossier-stage");
    const frame = page.locator(".project-dossier-layer.is-shown .media-frame").last();
    await expect(stage).toHaveClass(/is-pending/, { timeout: 3000 });
    await waitRevealed(frame);
  });

  test("CASE C: first fails→auto recovery", async ({ page }) => {
    let failOptimizer = false;
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (failOptimizer && isNextImage(url)) {
        failOptimizer = false;
        await route.fulfill({ status: 502, body: "bad gateway" });
        return;
      }
      await route.continue();
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();

    const thumbs = page.locator(".project-dossier-thumb");
    if ((await thumbs.count()) < 3) {
      test.skip();
      return;
    }

    failOptimizer = true;
    await thumbs.nth(2).click();
    const frame = page.locator(".project-dossier-layer.is-shown .media-frame").last();
    await waitRevealed(frame);
    await expect(frame).toHaveAttribute("data-load-attempt", /retry|direct/);
  });

  test("CASE D: optimized fails, fallback succeeds", async ({ page }) => {
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (isNextImage(url)) {
        await route.fulfill({ status: 404, body: "missing" });
        return;
      }
      await route.continue();
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const frame = page.locator("#projects .media-frame").first();
    await waitRevealed(frame);
    await expect(frame).toHaveAttribute("data-load-attempt", "direct");
    const src = await frame.locator("img.media-full").getAttribute("src");
    expect(src).toMatch(/cdn\.sanity\.io\/images/);
    expect(src).not.toContain("/_next/image");
  });

  test("CASE E: all fail→stable error, no infinite blur", async ({ page }) => {
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (isNextImage(url) || isSanityStill(url)) {
        await route.fulfill({ status: 404, body: "missing" });
        return;
      }
      await route.continue();
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const frame = page.locator("#projects .media-frame").first();
    await expect(frame).toHaveAttribute("data-load-state", "error", {
      timeout: 20_000,
    });
    await expect(frame.locator(".media-lqip")).toHaveCount(0);
    await expect(frame.locator(".media-load-error")).toHaveCount(1);
  });

  test("CASE F: rapid A→B→C, C wins, no stale callbacks", async ({ page }) => {
    let delayed = false;
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (delayed && isNextImage(url)) {
        const response = await route.fetch();
        await new Promise((r) => setTimeout(r, 600));
        await route.fulfill({ response });
        return;
      }
      await route.continue();
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();

    const thumbs = page.locator(".project-dossier-thumb");
    const count = await thumbs.count();
    if (count < 4) {
      test.skip();
      return;
    }

    delayed = true;
    await thumbs.nth(1).click();
    await thumbs.nth(2).click();
    await thumbs.nth(3).click();

    await expect(page.locator(".project-dossier-counter")).toContainText("04", {
      timeout: 20_000,
    });
    const stageFrame = page
      .locator(".project-dossier-layer.is-shown .media-frame")
      .last();
    await waitRevealed(stageFrame);
  });

  test("CASE G: decode rejection, no infinite blur", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLImageElement.prototype.decode;
      let calls = 0;
      HTMLImageElement.prototype.decode = function () {
        calls += 1;
        if (calls === 1) return Promise.reject(new Error("decode fail"));
        return orig.call(this);
      };
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const frame = page.locator("#projects .media-frame").first();
    await waitRevealed(frame);
    await expect(frame.locator(".media-lqip")).toHaveCount(0);
  });
});

test.describe("MediaImage viewport cold load", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("portfolio, hero, in-progress reach revealed on mobile", async ({
    page,
  }) => {
    await openHome(page, { reducedMotion: false });

    const hero = page.locator("#top .media-frame").first();
    await waitRevealed(hero);

    await page.locator("#projects").scrollIntoViewIfNeeded();
    const portfolio = page.locator("#projects .media-frame").first();
    await waitRevealed(portfolio);

    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });
    const inProgress = page.locator(".in-progress-visual .media-frame").first();
    await waitRevealed(inProgress);
  });
});
