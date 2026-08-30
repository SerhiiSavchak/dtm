import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

test.describe("Portfolio media loading", () => {
  test("keeps previous frame visible with loader under delayed media", async ({
    page,
  }) => {
    let delayed = false;
    const slowMs = 1500;

    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (delayed && url.includes("/_next/image")) {
        const response = await route.fetch();
        await new Promise((resolve) => setTimeout(resolve, slowMs));
        await route.fulfill({ response });
        return;
      }
      await route.continue();
    });

    await openHome(page, { reducedMotion: false });
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();
    await expect(page.getByRole("button", { name: "Закрити" })).toBeVisible();

    const thumbs = page.locator(".project-dossier-thumb");
    const count = await thumbs.count();
    const targetIndex = count > 3 ? 3 : count - 1;
    if (targetIndex < 2) {
      test.skip();
      return;
    }

    const firstLayer = page.locator(".project-dossier-layer.is-shown").first();
    await expect(firstLayer).toBeVisible();

    delayed = true;
    await thumbs.nth(targetIndex).click();

    await expect(page.locator(".project-dossier-wait.is-on")).toBeVisible({
      timeout: 2000,
    });
    await expect(firstLayer).toBeVisible();
    await expect(thumbs.nth(targetIndex)).toHaveClass(/is-active/);

    await expect(page.locator(".project-dossier-wait.is-on")).toHaveCount(0, {
      timeout: 12_000,
    });
    await expect(page.locator(".project-dossier-counter")).toContainText(
      String(targetIndex + 1).padStart(2, "0")
    );
  });
});
