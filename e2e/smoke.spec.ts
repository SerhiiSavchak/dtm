import { expect, test } from "@playwright/test";
import {
  completeCalculatorToLead,
  fillLead,
  mockLeadsApi,
  openHome,
} from "./helpers";

test.describe("smoke", () => {
  test("homepage, header, locale, theme, portfolio, calculator, faq", async ({
    page,
  }) => {
    await openHome(page);
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");

    await page.locator('.site-header a.site-nav-link[href="#services"]').click();
    await expect(page.locator("#services")).toBeInViewport();

    await page.getByRole("button", { name: "Switch to English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByRole("button", { name: "Switch to Ukrainian" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");

    await page.getByRole("button", { name: "Світла тема" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Темна тема" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();
    await page.getByRole("button", { name: "Закрити" }).click();

    await completeCalculatorToLead(page);
    await fillLead(page);
    await mockLeadsApi(page, "success");
    await page.locator("#estimate").locator(".calc-submit").click();
    await expect(
      page.getByRole("heading", { name: /Дякуємо! Ми отримали вашу заявку/ })
    ).toBeVisible();

    await page.locator("#faq").scrollIntoViewIfNeeded();
    const faq = page.locator(".faq-question").first();
    await faq.click();
    await expect(faq).toHaveAttribute("aria-expanded", "true");
    await faq.click();
    await expect(faq).toHaveAttribute("aria-expanded", "false");
  });

  test("mobile menu opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);
    await page.getByRole("button", { name: "Відкрити меню" }).click();
    await expect(page.getByRole("navigation", { name: "Мобільна навігація" })).toBeVisible();
    await page.getByRole("button", { name: "Закрити меню" }).click();
    await expect(page.getByRole("navigation", { name: "Мобільна навігація" })).toBeHidden();
  });

  test("lead failure path with mocked backend", async ({ page }) => {
    await openHome(page);
    await completeCalculatorToLead(page);
    await fillLead(page);
    await mockLeadsApi(page, "fail");
    await page.locator("#estimate").locator(".calc-submit").click();
    await expect(page.locator("#estimate .calc-feedback-msg")).toContainText(
      "Не вдалося надіслати запит"
    );
    await expect(page.locator("#estimate").locator('input[id$="-name"]')).toHaveValue("Тест Авто");
  });
});
