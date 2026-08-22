import { expect, test } from "@playwright/test";
import {
  completeCalculatorToLead,
  fillLead,
  openHome,
} from "./helpers";

async function submitWithStatus(
  page: import("@playwright/test").Page,
  status: number,
  body: Record<string, unknown>
) {
  await page.route("**/api/leads", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  await page.locator("#estimate").locator(".calc-submit").click();
}

test.describe("lead API UI states", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
    await completeCalculatorToLead(page);
    await fillLead(page);
  });

  test("400 keeps form and shows error", async ({ page }) => {
    await submitWithStatus(page, 400, { ok: false, error: "invalid_payload" });
    await expect(page.locator("#estimate .calc-feedback-msg")).toContainText(
      "Не вдалося надіслати запит"
    );
    await expect(page.locator("#estimate").locator('input[id$="-name"]')).toHaveValue(
      "Тест Авто"
    );
  });

  test("429 keeps form and allows retry", async ({ page }) => {
    await submitWithStatus(page, 429, { ok: false, error: "rate_limited" });
    await expect(page.locator("#estimate .calc-feedback-msg")).toContainText(
      "Не вдалося надіслати запит"
    );
    await page.unroute("**/api/leads");
    await page.route("**/api/leads", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          leadId: "DTM-TEST-0001",
          requestId: "test",
          visitorDraft: "draft",
          delivered: { telegram: true, email: false },
        }),
      });
    });
    await page.locator("#estimate").locator(".calc-submit").click();
    await expect(
      page.getByRole("heading", { name: /Дякуємо! Ми отримали вашу заявку/ })
    ).toBeVisible();
  });

  test("telegram false is not success", async ({ page }) => {
    await submitWithStatus(page, 200, {
      ok: true,
      leadId: "DTM-TEST-0001",
      delivered: { telegram: false, email: true },
    });
    await expect(page.locator("#estimate .calc-feedback-msg")).toContainText(
      "Не вдалося надіслати запит"
    );
  });
});
