import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";
import portfolioSnapshot from "../data/generated/portfolio.snapshot.json" with { type: "json" };
import inProgressSnapshot from "../data/generated/in-progress.snapshot.json" with { type: "json" };

test.describe("CMS last-known-good snapshot fallback", () => {
  test("Sanity outage still renders snapshot portfolio and in-progress", async ({
    page,
  }) => {
    const expectedTitle = portfolioSnapshot.projects[0]?.titleUa;
    expect(expectedTitle).toBeTruthy();
    expect(portfolioSnapshot.projects).toHaveLength(7);
    expect(portfolioSnapshot.projects[0]?.slug).toBe("private-house-sokilnyky");
    expect(expectedTitle).not.toMatch(/Кухня-вітальня/);
    expect(inProgressSnapshot.boardIds).toEqual([
      "perfect-life-60",
      "huge-lux-90",
      "natsionalnyi-70",
      "ms-100",
    ]);
    expect(inProgressSnapshot.frames).toHaveLength(4);

    await page.route("**/*", async (route) => {
      const url = route.request().url();
      const isSanityApi =
        url.includes(".api.sanity.io") || url.includes(".apicdn.sanity.io");
      if (isSanityApi) {
        await route.abort("failed");
        return;
      }
      await route.continue();
    });

    await page.setExtraHTTPHeaders({
      "x-dtm-simulate-sanity-failure": "1",
    });
    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const cards = page.getByRole("button", { name: /Відкрити проєкт/ });
    await expect(cards).toHaveCount(portfolioSnapshot.projects.length);
    await expect(
      page.locator("#projects img[srcset*='cdn.sanity.io'], #projects img[src*='cdn.sanity.io']").first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(cards.first()).toContainText(expectedTitle!);
    await expect(cards.first()).not.toContainText("Кухня-вітальня");
    await expect(page.locator("#projects")).toContainText("ЖК Квіти Львова");
    await expect(page.locator("#projects")).toContainText("ЖК Tiffany Apartments");
    await expect(page.locator("#projects")).toContainText("ЖК Шенген");
    await expect(page.locator("#projects")).toContainText("вул. Червоної Калини");

    await cards.first().click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
    await expect(page.locator(".project-dossier-stage[data-fit]")).toHaveCount(0);
    await expect(page.locator(".project-dossier-layer[data-fit]").first()).toBeVisible();
    const thumbs = page.getByRole("button", { name: /Кадр / });
    if ((await thumbs.count()) > 2) {
      await thumbs.nth(2).click();
      await expect(page.locator(".project-dossier-counter")).toContainText("03");
    }
    await page.getByRole("button", { name: "Закрити" }).click();

    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    const panels = page.locator(".in-progress-panel");
    await expect(panels).toHaveCount(4);
    await expect(panels.nth(0)).toHaveAttribute("aria-label", /Perfect Life/);
    await expect(panels.nth(1)).toHaveAttribute("aria-label", /Huge Lux/);
    await expect(panels.nth(2)).toHaveAttribute("aria-label", /Національний/);
    await expect(panels.nth(3)).toHaveAttribute("aria-label", /ЖК MS/);
    await expect(panels.nth(3)).toHaveAttribute("aria-label", /ВІДЕО/);
    await expect(page.locator("#in-progress")).not.toContainText("Кухня-вітальня");

    const geometry = await page.evaluate(() => {
      const visual = document.querySelector(".in-progress-visual");
      const full = document.querySelector(".in-progress-visual .media-full");
      if (!visual || !full) return null;
      return {
        visual: getComputedStyle(visual).transform,
        full: getComputedStyle(full).transform,
      };
    });
    expect(geometry?.visual).toBe("none");
    expect(geometry?.full).toBe("none");

    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });
    const firstFrame = inProgressSnapshot.frames.find(
      (frame) => frame.id === inProgressSnapshot.boardIds[0]
    );
    expect(firstFrame?.previewVideo).toBeTruthy();
    await expect
      .poll(
        async () =>
          page
            .locator(".in-progress-panel")
            .first()
            .locator("video source")
            .getAttribute("src"),
        { timeout: 15_000 }
      )
      .toBe(firstFrame?.previewVideo ?? null);

    await panels.nth(1).click();
    await page.waitForTimeout(200);
    await panels.nth(1).click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible({
      timeout: 10_000,
    });
    const secondFrame = inProgressSnapshot.frames.find(
      (frame) => frame.id === inProgressSnapshot.boardIds[1]
    );
    await expect
      .poll(
        async () =>
          page.locator(".in-progress-viewer video source").getAttribute("src"),
        { timeout: 10_000 }
      )
      .toBe(secondFrame?.video ?? null);

    for (let i = 0; i < inProgressSnapshot.frames.length + 2; i += 1) {
      await page.keyboard.press("ArrowRight");
    }
    await page.keyboard.press("Escape");
    await expect(page.locator(".in-progress-viewer")).toHaveCount(0);

    await panels.nth(3).click();
    await page.waitForTimeout(200);
    await panels.nth(3).click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator(".in-progress-viewer [aria-label*='ВІДЕО'], .in-progress-viewer").first()
    ).toBeVisible();
    await page.keyboard.press("Escape");
  });
});
