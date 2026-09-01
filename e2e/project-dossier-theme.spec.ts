import { expect, test, type Page } from "@playwright/test";
import { openHome } from "./helpers";

async function openFirstDossier(page: Page) {
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Відкрити проєкт/ }).first().click();
  await expect(page.locator(".project-dossier")).toBeVisible();
}

/** Mirrors ThemeProvider.setTheme — dossier styling follows html[data-theme]. */
async function applySiteTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((next) => {
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("dtm-theme", next);
  }, theme);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

async function readDossierThemeTokens(page: Page) {
  return page.evaluate(() => {
    const dossier = document.querySelector(".project-dossier");
    const root = document.documentElement;
    if (!dossier) return null;

    const dossierStyle = getComputedStyle(dossier);
    const rootStyle = getComputedStyle(root);
    const theme = root.getAttribute("data-theme");

    const pageBg = rootStyle.getPropertyValue("--color-bg").trim();
    const pageText = rootStyle.getPropertyValue("--color-text").trim();
    const inkDeep = rootStyle.getPropertyValue("--ink-deep").trim();
    const paper = rootStyle.getPropertyValue("--paper").trim();

    const surface = dossierStyle.getPropertyValue("--dossier-surface").trim();
    const fg = dossierStyle.getPropertyValue("--dossier-fg").trim();
    const mediaChrome = dossierStyle
      .getPropertyValue("--dossier-media-chrome")
      .trim();

    const expectedSurface = theme === "light" ? pageBg : inkDeep;
    const expectedFg = theme === "light" ? pageText : paper;
    const expectedMediaChrome = theme === "light" ? pageBg : inkDeep;

    return {
      theme,
      surface,
      fg,
      mediaChrome,
      expectedSurface,
      expectedFg,
      expectedMediaChrome,
      backgroundColor: dossierStyle.backgroundColor,
      surfaceUsesThemeToken:
        surface === expectedSurface &&
        fg === expectedFg &&
        mediaChrome === expectedMediaChrome,
    };
  });
}

test.describe("ProjectDossier theme", () => {
  test("follows site theme and updates while open", async ({ page }) => {
    await openHome(page);
    await openFirstDossier(page);

    const dark = await readDossierThemeTokens(page);
    expect(dark?.theme).toBe("dark");
    expect(dark?.surfaceUsesThemeToken).toBe(true);
    expect(dark?.backgroundColor).not.toBe("rgb(255, 255, 255)");

    await applySiteTheme(page, "light");

    const light = await readDossierThemeTokens(page);
    expect(light?.theme).toBe("light");
    expect(light?.surfaceUsesThemeToken).toBe(true);
    expect(light?.backgroundColor).toBe("rgb(255, 255, 255)");

    await applySiteTheme(page, "dark");

    const backDark = await readDossierThemeTokens(page);
    expect(backDark?.surfaceUsesThemeToken).toBe(true);
    expect(backDark?.backgroundColor).not.toBe("rgb(255, 255, 255)");
  });

  test("header theme toggle selects light before open", async ({ page }) => {
    await openHome(page);
    await page.getByRole("button", { name: "Світла тема" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await openFirstDossier(page);

    const tokens = await readDossierThemeTokens(page);
    expect(tokens?.surfaceUsesThemeToken).toBe(true);
  });

  for (const width of [390, 414, 768, 1366, 1920]) {
    test(`light theme readable at ${width}px with no filmstrip seam`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await openHome(page);
      await applySiteTheme(page, "light");
      await openFirstDossier(page);

      const tokens = await readDossierThemeTokens(page);
      expect(tokens?.surfaceUsesThemeToken).toBe(true);

      await expect(page.locator(".project-dossier-close")).toBeVisible();
      await expect(page.locator(".project-dossier-title")).toBeVisible();
      await expect(page.locator(".project-dossier-nav-btn").first()).toBeVisible();

      const filmstrip = page.locator(".project-dossier-filmstrip");
      if ((await filmstrip.count()) > 0) {
        const seam = await page.evaluate(() => {
          const strip = document.querySelector(".project-dossier-filmstrip");
          const wrap = document.querySelector(".project-dossier-stage-wrap");
          if (!strip || !wrap) return null;
          return strip.getBoundingClientRect().top - wrap.getBoundingClientRect().bottom;
        });
        expect(seam).not.toBeNull();
        expect(seam!).toBeLessThanOrEqual(0.5);

        const unifiedChrome = await page.evaluate(() => {
          const strip = document.querySelector(".project-dossier-filmstrip");
          const wrap = document.querySelector(".project-dossier-stage-wrap");
          if (!strip || !wrap) return true;
          const stripBg = getComputedStyle(strip).backgroundColor;
          const wrapBg = getComputedStyle(wrap).backgroundColor;
          return stripBg === wrapBg;
        });
        expect(unifiedChrome).toBe(true);
      }

      await applySiteTheme(page, "dark");
      const darkWhileOpen = await readDossierThemeTokens(page);
      expect(darkWhileOpen?.surfaceUsesThemeToken).toBe(true);
    });
  }
});
