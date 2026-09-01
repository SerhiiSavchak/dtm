import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

test.describe("Real Portfolio development content", () => {
  test("seven real projects render with CDN media and dossier facts", async ({
    page,
  }) => {
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const cards = page.getByRole("button", { name: /Відкрити проєкт/ });
    await expect(cards).toHaveCount(7);
    await expect(cards.first()).toContainText(/вул\. Затишна|Zatyshna/i);
    await expect(cards.first()).toContainText(/Приватний будинок|Private house/i);
    await expect(cards.first()).toContainText(/Сокільники|Sokilnyky/i);
    await expect(
      page.locator("#projects img[srcset*='cdn.sanity.io'], #projects img[src*='cdn.sanity.io']").first()
    ).toBeVisible({ timeout: 15_000 });

    await cards.first().click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
    await expect(page.locator(".project-dossier-meta")).toHaveCount(0);
    await expect(page.locator(".project-dossier-facts")).toBeVisible();
    await expect(page.locator(".project-dossier-facts")).toContainText(
      /Приватний будинок|Private house/
    );
    await expect(page.locator(".project-dossier-facts")).toContainText(/265/);
    await expect(page.locator(".project-dossier-fact dt", { hasText: /^Рік$|^Year$/ })).toHaveCount(0);
    await expect(page.locator(".project-dossier-copy")).toHaveCount(0);
    await expect(page.locator(".project-dossier-layer[data-fit]").first()).toBeVisible();
    await page.getByRole("button", { name: "Закрити" }).click();

    await cards.nth(2).click();
    await expect(page.locator(".project-dossier-title")).toContainText(/ЖК Квіти Львова|Kvity/i);
    await expect(page.locator(".project-dossier-title")).not.toContainText(/3-кімнат/i);
    await expect(page.locator(".project-dossier-facts")).toContainText(/Кімнати|Rooms/);
    await expect(page.locator(".project-dossier-facts")).toContainText("3");
    await expect(page.locator(".project-dossier-facts")).toContainText(/Новобудова|New build/);
    await expect(page.locator(".project-dossier video")).toHaveCount(0);
    await page.getByRole("button", { name: "Закрити" }).click();

    await page.locator("#in-progress").scrollIntoViewIfNeeded();
    await expect(page.locator(".in-progress-panel")).toHaveCount(4);
  });

  test("area values stay on one line in portfolio cards", async ({ page }) => {
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const areas = page.locator(".project-slide-area");
    await expect(areas.first()).toBeVisible();
    const count = await areas.count();
    for (let i = 0; i < count; i += 1) {
      const area = areas.nth(i);
      const text = (await area.textContent())?.trim() ?? "";
      expect(text).toMatch(/\d+\s*м²/);
      const nowrap = await area.evaluate((el) => getComputedStyle(el).whiteSpace);
      expect(nowrap).toBe("nowrap");
    }
  });

  test("mobile dossier has no seam between filmstrip and info", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();

    const gap = await page.evaluate(() => {
      const filmstrip = document.querySelector(".project-dossier-filmstrip");
      const body = document.querySelector(".project-dossier-body");
      if (!filmstrip || !body) return null;
      return body.getBoundingClientRect().top - filmstrip.getBoundingClientRect().bottom;
    });
    expect(gap).not.toBeNull();
    expect(gap!).toBeLessThanOrEqual(0.5);
  });

  for (const width of [390, 414, 768, 1366, 1920]) {
    test(`portfolio usable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await openHome(page);
      await page.locator("#projects").scrollIntoViewIfNeeded();
      await expect(page.getByRole("button", { name: /Відкрити проєкт/ })).toHaveCount(7);
      await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();
      await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
      await page.getByRole("button", { name: "Закрити" }).click();
    });
  }
});
