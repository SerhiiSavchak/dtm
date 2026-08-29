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
    expect(inProgressSnapshot.boardIds).toHaveLength(4);
    expect(inProgressSnapshot.frames.length).toBeGreaterThanOrEqual(4);

    await page.setExtraHTTPHeaders({
      "x-dtm-simulate-sanity-failure": "1",
    });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const cards = page.getByRole("button", { name: /Відкрити проєкт/ });
    await expect(cards).toHaveCount(portfolioSnapshot.projects.length);
    await expect(
      page.locator("#projects img[srcset*='cdn.sanity.io'], #projects img[src*='cdn.sanity.io']").first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(cards.first()).toContainText(expectedTitle!);

    await cards.first().click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
    await expect(page.locator(".project-dossier-stage[data-fit]")).toHaveCount(0);
    await expect(page.locator(".project-dossier-layer[data-fit]").first()).toBeVisible();
    await page.getByRole("button", { name: "Закрити" }).click();

    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    const panels = page.locator(".in-progress-panel");
    await expect(panels).toHaveCount(4);
    await expect(panels.nth(3)).toHaveAttribute("aria-label", /ВІДЕО/);
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

    await panels.nth(1).click();
    await page.waitForTimeout(200);
    await panels.nth(1).click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible({
      timeout: 10_000,
    });
    // Walk the full collection while viewer is open
    for (let i = 0; i < inProgressSnapshot.frames.length + 2; i += 1) {
      await page.keyboard.press("ArrowRight");
    }
    await page.keyboard.press("Escape");
    await expect(page.locator(".in-progress-viewer")).toHaveCount(0);

    // Video board slot (4th panel) remains reachable
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
