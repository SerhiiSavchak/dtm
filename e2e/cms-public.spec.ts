import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

test.describe("cms public surfaces", () => {
  test("portfolio dossier gallery and close", async ({ page }) => {
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const cards = page.getByRole("button", { name: /Відкрити проєкт/ });
    await expect(cards).toHaveCount(7);

    await cards.first().click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
    const thumbs = page.getByRole("button", { name: /Кадр / });
    await expect(thumbs.first()).toBeVisible();
    if ((await thumbs.count()) > 1) {
      await thumbs.nth(1).click();
      await thumbs.nth(0).click();
      await thumbs.nth(1).click();
    }
    const layerFit = page.locator(".project-dossier-layer[data-fit]");
    await expect(layerFit.first()).toBeVisible();
    await expect(page.locator(".project-dossier-stage[data-fit]")).toHaveCount(0);
    await page.getByRole("button", { name: "Закрити" }).click();
    await expect(page.getByRole("button", { name: "Закрити" })).toHaveCount(0);
  });

  test("in-progress panels, viewer, video, no media scale", async ({
    page,
  }) => {
    await openHome(page);
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    const panels = page.locator(".in-progress-panel");
    await expect(panels).toHaveCount(4);
    await expect(panels.nth(0)).toHaveAttribute(
      "aria-label",
      /01 \/ 10/
    );
    await expect(panels.nth(3)).toHaveAttribute("aria-label", /ВІДЕО/);

    const geometry = await page.evaluate(() => {
      const visual = document.querySelector(".in-progress-visual");
      const full = document.querySelector(".in-progress-visual .media-full");
      if (!visual || !full) return null;
      return {
        visual: getComputedStyle(visual).transform,
        full: getComputedStyle(full).transform,
        visW: Math.round(visual.getBoundingClientRect().width),
        panelW: Math.round(
          visual.closest(".in-progress-panel")?.getBoundingClientRect().width ?? 0
        ),
      };
    });
    expect(geometry?.visual).toBe("none");
    expect(geometry?.full).toBe("none");
    expect(geometry?.visW).toBeGreaterThan(0);

    await panels.nth(1).click();
    await page.waitForTimeout(200);
    await panels.nth(1).click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible({
      timeout: 10_000,
    });
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
    await expect(page.locator(".in-progress-viewer")).toHaveCount(0);
  });

  test("mobile portfolio and in-progress remain usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: /Відкрити проєкт/ })).toHaveCount(7);
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-panel")).toHaveCount(4);
  });
});
