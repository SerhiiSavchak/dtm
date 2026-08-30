import { expect, test } from "@playwright/test";

test.describe("admin auth", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("anonymous /admin asks for Sanity login", async ({ page }) => {
    await page.goto("/admin");
    const login = page.getByRole("link", { name: /Google|GitHub|E-mail/i });
    const studio = page.getByText("Наші роботи");
    await expect(login.first().or(studio)).toBeVisible({ timeout: 25_000 });
    const loginCount = await login.count();
    if (loginCount === 0) {
      throw new Error(
        "Studio desk visible without Sanity login — anonymous CMS access"
      );
    }
    await expect(login.first()).toBeVisible();
    await expect(studio).toHaveCount(0);
  });
});
