import { expect, test } from "@playwright/test";
import { completeCalculatorToLead, fillLead, mockLeadsApi, openHome } from "./helpers";
import { PUBLIC_TELEGRAM_URL } from "../lib/leads/labels";

const CLIENT_URL = "https://t.me/+380931230505";

test.describe("public Telegram contact CTAs", () => {
  test("canonical URL is the client phone deep-link", () => {
    expect(PUBLIC_TELEGRAM_URL).toBe(CLIENT_URL);
  });

  test("homepage Telegram links use the centralized client URL", async ({
    page,
  }) => {
    await openHome(page);
    const links = page.locator('a[href*="t.me"]');
    await expect(links.first()).toBeVisible();
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).toBe(CLIENT_URL);
      expect(href).not.toMatch(/xrayboy|t\.me\/093/i);
    }

    const finalCta = page.locator("#contacts a.btn-secondary");
    await expect(finalCta).toHaveAttribute("href", CLIENT_URL);
    await expect(finalCta).toHaveAttribute("rel", "noopener noreferrer");
    await expect(finalCta).toHaveAttribute("target", "_blank");

    await page.getByRole("button", { name: "Switch to English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const enLinks = page.locator('a[href*="t.me"]');
    const enCount = await enLinks.count();
    for (let i = 0; i < enCount; i += 1) {
      expect(await enLinks.nth(i).getAttribute("href")).toBe(CLIENT_URL);
    }
  });

  test("calculator error CTA uses the centralized client URL", async ({
    page,
  }) => {
    await openHome(page);
    await completeCalculatorToLead(page);
    await fillLead(page);
    await mockLeadsApi(page, "fail");
    await page.locator("#estimate").locator(".calc-submit").click();
    const telegram = page.locator("#estimate a.btn-ghost").filter({
      hasText: /Telegram/i,
    });
    await expect(telegram).toHaveAttribute("href", CLIENT_URL);
    await expect(telegram).toHaveAttribute("rel", "noopener noreferrer");
  });
});
