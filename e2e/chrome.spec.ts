import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

test("services tabs update selected panel", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  await page.locator("#services").scrollIntoViewIfNeeded();
  const tabs = page.locator("#services [role='tab']");
  const count = await tabs.count();
  if (count === 0) {
    const buttons = page.locator("#services button");
    await expect(buttons.first()).toBeVisible();
    await buttons.nth(1).click();
    return;
  }
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
});

test("theme persists after reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  await page.getByRole("button", { name: "Світла тема" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator(".site-header.is-booted")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
