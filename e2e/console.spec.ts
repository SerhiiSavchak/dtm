import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

test("homepage has no pageerror or failed 4xx/5xx assets", async ({ page }) => {
  const pageErrors: string[] = [];
  const failed: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes("favicon")) {
      failed.push(`${status} ${url}`);
    }
  });
  await openHome(page);
  await page.locator("#faq").scrollIntoViewIfNeeded();
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  expect(failed, failed.join("\n")).toEqual([]);
});
