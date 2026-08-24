import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

const statePath = path.join(process.cwd(), "tmp", "cms-qa-state.json");

function loadState() {
  if (!existsSync(statePath)) {
    throw new Error("tmp/cms-qa-state.json missing — run qa:cms mutations first");
  }
  return JSON.parse(readFileSync(statePath, "utf8"));
}

test.describe("cms live QA (development content)", () => {
  test.skip(
    process.env.DTM_CMS_QA !== "1",
    "Live CMS QA runs only via npm run qa:cms"
  );

  test("QA project card, dossier, gallery, outgoing data-fit", async ({
    page,
  }) => {
    const state = loadState();
    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const cards = page.getByRole("button", { name: /Відкрити проєкт/ });
    await expect(cards).toHaveCount(state.projectCount);
    const qa = page.getByRole("button", {
      name: new RegExp(`Відкрити проєкт: ${state.qaTitle}`),
    });
    await expect(qa).toBeVisible();
    await qa.click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
    const thumbs = page.getByRole("button", { name: /Кадр / });
    await expect(thumbs).toHaveCount(state.galleryCount);
    await expect(page.locator(".project-dossier-stage[data-fit]")).toHaveCount(0);
    await expect(page.locator(".project-dossier-layer[data-fit]").first()).toBeVisible();

    if (state.galleryCount > 1) {
      const outgoingFit = await page
        .locator(".project-dossier-layer.is-shown")
        .first()
        .getAttribute("data-fit");
      await thumbs.nth(1).click();
      const layers = page.locator(".project-dossier-layer[data-fit]");
      await expect.poll(async () => layers.count()).toBeGreaterThan(0);
      const fits = await layers.evaluateAll((nodes) =>
        nodes.map((node) => ({
          fit: node.getAttribute("data-fit"),
          shown: node.classList.contains("is-shown"),
        }))
      );
      expect(fits.some((item) => item.fit === outgoingFit)).toBeTruthy();
      expect(
        await page.locator(".project-dossier-stage[data-fit]").count()
      ).toBe(0);
      await thumbs.nth(2).click();
      await thumbs.nth(0).click();
      await thumbs.nth(1).click();
      await thumbs.nth(0).click();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowLeft");
    }

    await page.getByRole("button", { name: "Закрити" }).click();
    await expect(page.getByRole("button", { name: "Закрити" })).toHaveCount(0);
    await qa.click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
    await page.getByRole("button", { name: "Закрити" }).click();
  });

  test("in-progress board QA panel opens correct viewer index", async ({
    page,
  }) => {
    const state = loadState();
    await openHome(page);
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    const panels = page.locator(".in-progress-panel");
    await expect(panels).toHaveCount(4);
    const n = String(state.viewerIndex + 1).padStart(2, "0");
    const total = String(state.collectionCount).padStart(2, "0");
    await expect(panels.nth(state.boardSlot)).toHaveAttribute(
      "aria-label",
      new RegExp(`${n} / ${total}`)
    );

    const geometry = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll(".in-progress-visual")];
      return nodes.map((visual) => ({
        transform: getComputedStyle(visual).transform,
        full: getComputedStyle(
          visual.querySelector(".media-full") ?? visual
        ).transform,
      }));
    });
    for (const item of geometry) {
      expect(item.transform).toBe("none");
      expect(item.full).toBe("none");
    }

    for (let i = 0; i < 4; i += 1) {
      await panels.nth(i).hover();
    }
    await panels.nth(state.boardSlot).click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible({
      timeout: 10_000,
    });
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
    await expect(page.locator(".in-progress-viewer")).toHaveCount(0);
    await panels.nth(state.boardSlot).click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  for (const width of [390, 768, 1366, 1920]) {
    test(`CMS sections usable at ${width}px`, async ({ page }) => {
      const state = loadState();
      await page.setViewportSize({ width, height: 844 });
      await openHome(page);
      await page.locator("#projects").scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", { name: /Відкрити проєкт/ })
      ).toHaveCount(state.projectCount);
      await page
        .getByRole("button", {
          name: new RegExp(`Відкрити проєкт: ${state.qaTitle}`),
        })
        .click();
      await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
      await page.getByRole("button", { name: "Закрити" }).click();
      await page.locator("#in-progress").scrollIntoViewIfNeeded();
      await expect(page.locator(".in-progress-panel")).toHaveCount(4);
      await page.locator(".in-progress-panel").nth(0).click();
      await expect(page.locator(".in-progress-viewer")).toBeVisible({
        timeout: 10_000,
      });
      await page.keyboard.press("Escape");
    });
  }
});
