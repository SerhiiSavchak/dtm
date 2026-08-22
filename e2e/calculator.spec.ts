import { expect, test } from "@playwright/test";
import {
  clickBack,
  clickNext,
  completeCalculatorToLead,
  fillLead,
  goToCalculator,
  mockLeadsApi,
  openHome,
} from "./helpers";

test.describe("calculator", () => {
  test("completes, goes back, and keeps previous answers", async ({ page }) => {
    await openHome(page);
    await goToCalculator(page);

    await page.getByRole("radio", { name: "Квартира" }).click();
    await clickNext(page);
    await expect(page.getByPlaceholder("наприклад 72")).toBeVisible();
    await page.getByPlaceholder("наприклад 72").fill("80");
    await clickNext(page);
    await page.locator("#estimate").getByRole("radio", { name: "3", exact: true }).click();
    await clickNext(page);

    await clickBack(page);
    await expect(
      page.locator("#estimate").getByRole("radio", { name: "3", exact: true })
    ).toHaveAttribute("aria-checked", "true");
    await clickBack(page);
    await expect(page.getByPlaceholder("наприклад 72")).toHaveValue("80");
    await clickBack(page);
    await page.locator("#estimate").getByRole("radio", { name: "Будинок" }).click();
    await clickNext(page);
    await expect(page.getByPlaceholder("наприклад 72")).toHaveValue("80");
    await clickNext(page);
    await expect(
      page.locator("#estimate").getByRole("radio", { name: "3", exact: true })
    ).toHaveAttribute("aria-checked", "true");

    await expect(page.getByText(/Крок/)).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute(
      "aria-valuenow",
      "38"
    );
  });

  test("blocks invalid required fields and invalid phone", async ({ page }) => {
    await openHome(page);
    await goToCalculator(page);
    await clickNext(page, false);
    await expect(page.getByText("Оберіть варіант, щоб продовжити")).toBeVisible();

    await completeCalculatorToLead(page);
    await page.locator("#estimate").locator(".calc-submit").click();
    await expect(page.getByText("Вкажіть ім")).toBeVisible();

    await page.locator("#estimate").locator('input[id$="-name"]').fill("Тест");
    await page.locator("#estimate").locator('input[id$="-phone"]').fill("123");
    await page.locator("#estimate").locator(".calc-submit").click();
    await expect(page.getByText("Перевірте номер телефону")).toBeVisible();

    await page.locator("#estimate").locator('input[id$="-phone"]').fill("0671234567");
    await mockLeadsApi(page, "success");
    await page.locator("#estimate").locator(".calc-submit").click();
    await expect(
      page.getByRole("heading", { name: /Дякуємо! Ми отримали вашу заявку/ })
    ).toBeVisible();
  });

  test("success, failure, retry, and double submit", async ({ page }) => {
    await openHome(page);
    await completeCalculatorToLead(page);
    await fillLead(page);

    const counter = { posts: 0 };
    await mockLeadsApi(page, "fail", counter);
    await page.locator("#estimate").locator(".calc-submit").click();
    await expect(page.locator("#estimate .calc-feedback-msg")).toContainText(
      "Не вдалося надіслати запит"
    );
    await expect(page.locator("#estimate").locator('input[id$="-name"]')).toHaveValue("Тест Авто");
    await expect(page.locator("#estimate").locator('input[id$="-phone"]')).toHaveValue("+380671234567");

    await page.unroute("**/api/leads");
    const successCounter = { posts: 0 };
    await page.route("**/api/leads", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      successCounter.posts += 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          leadId: "DTM-TEST-0001",
          requestId: "test-request",
          visitorDraft: "draft",
          delivered: { telegram: true, email: false },
        }),
      });
    });

    const submit = page.locator("#estimate").locator(".calc-submit");
    await submit.dblclick();
    await expect(
      page.getByRole("heading", { name: /Дякуємо! Ми отримали вашу заявку/ })
    ).toBeVisible();
    await expect(page.getByText("DTM-TEST-0001")).toBeVisible();
    expect(successCounter.posts).toBe(1);
    expect(counter.posts).toBe(1);
  });
});
