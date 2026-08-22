import { expect, test } from "@playwright/test";
import { openHome } from "./helpers";

const widths = [375, 390, 768, 1024, 1272, 1440, 1920];

test.describe("responsive overflow", () => {
  for (const width of widths) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await openHome(page);
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        };
      });
      expect(
        overflow.scrollWidth,
        `scrollWidth ${overflow.scrollWidth} vs client ${overflow.clientWidth}`
      ).toBeLessThanOrEqual(overflow.clientWidth + 2);
    });
  }
});
