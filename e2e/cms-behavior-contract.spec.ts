import { expect, test, type Page } from "@playwright/test";
import { openHome } from "./helpers";

async function readSpans(page: Page) {
  return page.locator("#projects [data-slide]").evaluateAll((nodes) =>
    nodes.map((node) => ({
      slug: node.getAttribute("data-project"),
      span: node.getAttribute("data-span"),
    }))
  );
}

test.describe("CMS behavioral contract surfaces", () => {
  test("locale swap changes copy only, layout spans stay", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const before = await readSpans(page);
    const titleBefore = (await page.locator(".project-slide-title").first().textContent())?.trim();
    await page.getByRole("button", { name: "Switch to English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect.poll(async () =>
      (await page.locator(".project-slide-title").first().textContent())?.trim()
    ).not.toBe("");
    const afterEn = await readSpans(page);
    expect(afterEn).toEqual(before);
    const titleEn = (await page.locator(".project-slide-title").first().textContent())?.trim();
    expect(titleEn).toBeTruthy();
    expect(titleEn).not.toMatch(/undefined|null/i);
    await page.getByRole("button", { name: "Switch to Ukrainian" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
    const afterUk = await readSpans(page);
    expect(afterUk).toEqual(before);
    await expect.poll(async () =>
      (await page.locator(".project-slide-title").first().textContent())?.trim()
    ).toBe(titleBefore);
  });

  test("theme swap does not reset span, fit, or order", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const before = await readSpans(page);
    await page.getByRole("button", { name: "Світла тема" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await readSpans(page)).toEqual(before);
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();
    await expect(page.locator(".project-dossier-layer[data-fit]").first()).toBeVisible();
    const fit = await page.locator(".project-dossier-layer.is-shown").first().getAttribute("data-fit");
    expect(["contain", "cover"]).toContain(fit);
    await page.getByRole("button", { name: "Закрити" }).click();
    await page.getByRole("button", { name: "Темна тема" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(await readSpans(page)).toEqual(before);
  });

  test("dossier next/prev follows CMS order; 30 open/close cycles", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const cards = page.getByRole("button", { name: /Відкрити проєкт/ });
    const count = await cards.count();
    expect(count).toBe(7);
    const titles = [];
    for (let i = 0; i < count; i += 1) {
      titles.push(((await cards.nth(i).getAttribute("aria-label")) ?? "").replace(/^[^:]+:\s*/, ""));
    }

    await cards.first().click();
    await expect(page.locator(".project-dossier-title")).toContainText(titles[0] ?? "");
    for (let i = 1; i < count; i += 1) {
      await page.locator(".project-dossier-nav-btn.is-next").click();
      await expect(page.locator(".project-dossier-title")).toContainText(titles[i] ?? "");
    }
    await page.locator(".project-dossier-nav-btn").first().click();
    await expect(page.locator(".project-dossier-title")).toContainText(titles[count - 2] ?? "");
    await page.getByRole("button", { name: "Закрити" }).click();

    for (let i = 0; i < 30; i += 1) {
      await cards.nth(i % count).click();
      await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
      await page.getByRole("button", { name: "Закрити" }).click();
      await expect(page.getByRole("button", { name: "Закрити" })).toHaveCount(0);
    }
    expect(await readSpans(page)).toHaveLength(count);
  });

  test("failed images do not reset CMS card size", async ({ page }) => {
    await page.route("**/*.{jpg,jpeg,png,webp}", (route) => route.abort());
    await page.setViewportSize({ width: 1366, height: 768 });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const rendered = await page.locator("#projects [data-slide]").evaluateAll((nodes) =>
      nodes.map((node) => ({
        span: node.getAttribute("data-span"),
        width: node.getBoundingClientRect().width,
      }))
    );
    expect(rendered.length).toBe(7);
    for (const card of rendered) {
      expect(["large", "tall", "wide", "small"]).toContain(card.span);
      expect(card.width).toBeGreaterThan(80);
    }
    const unique = new Set(rendered.map((card) => card.span));
    if (unique.size >= 2) {
      const grouped = new Map<string, number[]>();
      for (const card of rendered) {
        const list = grouped.get(card.span ?? "") ?? [];
        list.push(card.width ?? 0);
        grouped.set(card.span ?? "", list);
      }
      const means = [...grouped.values()].map(
        (list) => list.reduce((sum, value) => sum + value, 0) / list.length
      );
      expect(Math.abs(means[0]! - means[1]!)).toBeGreaterThan(8);
    }
  });

  test("reload preserves spans (warm cache)", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const first = await readSpans(page);
    await page.reload();
    await expect(page.locator(".site-header.is-booted")).toBeVisible({ timeout: 15_000 });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    expect(await readSpans(page)).toEqual(first);
  });

  test("portfolio gallery has zero videos", async ({ page }) => {
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await expect(page.locator("#projects video")).toHaveCount(0);
    await page.getByRole("button", { name: /Відкрити проєкт/ }).nth(2).click();
    await expect(page.locator(".project-dossier video")).toHaveCount(0);
  });

  test("mobile in-progress: one preview, 20 switches, viewer uses full video", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page, { reducedMotion: false });
    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-board.is-interactive")).toBeVisible({
      timeout: 15_000,
    });
    const panels = page.locator(".in-progress-panel");
    await expect(panels).toHaveCount(4);

    for (let i = 0; i < 20; i += 1) {
      await panels.nth((i + 1) % 4).click();
      if ((await page.locator(".in-progress-viewer").count()) > 0) {
        await page.keyboard.press("Escape");
        await expect(page.locator(".in-progress-viewer")).toHaveCount(0);
      }
    }
    const activeCount = await page.locator(".in-progress-panel.is-active").count();
    expect(activeCount).toBe(1);

    const sources = await page.evaluate(() =>
      [...document.querySelectorAll(".in-progress-panel")].map((panel) => ({
        active: panel.classList.contains("is-active"),
        src: panel.querySelector("video source")?.getAttribute("src") ?? "",
      }))
    );
    expect(sources.filter((item) => item.src).length).toBeLessThanOrEqual(1);
    const panelSrc = sources.find((item) => item.active)?.src ?? "";
    expect(panelSrc).toMatch(/cdn\.sanity\.io\/files/);

    const active = page.locator(".in-progress-panel.is-active");
    const panelSrcBeforeOpen = await active.locator("video source").getAttribute("src");
    await active.click();
    await expect(page.locator(".in-progress-viewer")).toBeVisible({ timeout: 10_000 });
    const viewerSrc = await page.locator(".in-progress-viewer video source").getAttribute("src");
    expect(viewerSrc).toMatch(/cdn\.sanity\.io\/files/);
    expect(viewerSrc).toBeTruthy();
    if (panelSrcBeforeOpen) {
      expect(viewerSrc).not.toBe(panelSrcBeforeOpen);
    }
    await page.keyboard.press("Escape");
  });
});
