import { expect, type Page } from "@playwright/test";

const calc = (page: Page) => page.locator("#estimate");

export async function openHome(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".site-header.is-booted")).toBeVisible({
    timeout: 15_000,
  });
}

export async function goToCalculator(page: Page) {
  await page.locator("#estimate").scrollIntoViewIfNeeded();
  await expect(calc(page).locator(".calc-question").first()).toBeVisible();
}

async function questionText(page: Page) {
  return (await calc(page).locator(".calc-question").first().innerText()).trim();
}

export async function clickNext(page: Page, expectAdvance = true) {
  const before = expectAdvance ? await questionText(page) : "";
  await calc(page).getByRole("button", { name: "Далі" }).click();
  if (!expectAdvance) return;
  await expect
    .poll(async () => questionText(page), { timeout: 5_000 })
    .not.toBe(before);
  await page.waitForTimeout(280);
}

export async function clickBack(page: Page) {
  const before = await questionText(page);
  await calc(page).getByRole("button", { name: "Назад" }).click();
  await expect
    .poll(async () => questionText(page), { timeout: 5_000 })
    .not.toBe(before);
  await page.waitForTimeout(280);
}

export async function completeCalculatorToLead(page: Page) {
  await goToCalculator(page);
  await calc(page).getByRole("radio", { name: "Квартира" }).click();
  await clickNext(page);
  await calc(page).getByPlaceholder("наприклад 72").fill("72");
  await clickNext(page);
  await calc(page).getByRole("radio", { name: "2", exact: true }).click();
  await clickNext(page);
  await calc(page).getByRole("radio", { name: "Під ключ" }).click();
  await clickNext(page);
  await calc(page).getByRole("radio", { name: "Немає" }).click();
  await clickNext(page);
  await calc(page).getByRole("radio", { name: "Новобудова" }).click();
  await clickNext(page);
  await calc(page).getByRole("radio", { name: /1.3/ }).click();
  await clickNext(page);
  await expect(calc(page).locator('input[id$="-name"]')).toBeVisible();
}

export async function fillLead(page: Page, name = "Тест Авто", phone = "+380671234567") {
  await calc(page).locator('input[id$="-name"]').fill(name);
  await calc(page).locator('input[id$="-phone"]').fill(phone);
}

export async function mockLeadsApi(
  page: Page,
  mode: "success" | "fail",
  counter?: { posts: number }
) {
  await page.route("**/api/leads", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    if (counter) counter.posts += 1;
    if (mode === "fail") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: "delivery_failed",
          requestId: "test-request",
        }),
      });
      return;
    }
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
}
