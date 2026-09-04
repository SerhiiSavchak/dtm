import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { openHome } from "./helpers";
import portfolioSnapshot from "../data/generated/portfolio.snapshot.json" with { type: "json" };

const SPAN_VW = { large: 0.36, wide: 0.33, tall: 0.27, small: 0.23 } as const;
const SPAN_REM = { large: 32, wide: 29, tall: 23.5, small: 20 } as const;
const SPANS = ["large", "tall", "wide", "small"] as const;

const VIEWPORTS = [
  { width: 375, height: 812, mode: "equal" as const },
  { width: 390, height: 844, mode: "equal" as const },
  { width: 430, height: 932, mode: "equal" as const },
  { width: 768, height: 1024, mode: "tablet" as const },
  { width: 1024, height: 768, mode: "desktop" as const },
  { width: 1272, height: 900, mode: "desktop" as const },
  { width: 1366, height: 768, mode: "desktop" as const },
  { width: 1440, height: 900, mode: "desktop" as const },
  { width: 1920, height: 1080, mode: "desktop" as const },
];

async function expectedDesktop(page: Page) {
  return page.evaluate(
    ({ spanVw, spanRem }) => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const vw = window.innerWidth;
      return {
        large: Math.min(spanVw.large * vw, spanRem.large * rem),
        wide: Math.min(spanVw.wide * vw, spanRem.wide * rem),
        tall: Math.min(spanVw.tall * vw, spanRem.tall * rem),
        small: Math.min(spanVw.small * vw, spanRem.small * rem),
        leadOverride: Math.min(0.42 * vw, 36 * rem),
      };
    },
    { spanVw: SPAN_VW, spanRem: SPAN_REM }
  );
}

async function injectFixture(page: Page, spans: string[], markLead = true) {
  await page.evaluate(
    ({ list, lead }) => {
      document.getElementById("cms-span-fixture")?.remove();
      const viewport = document.createElement("div");
      viewport.id = "cms-span-fixture";
      viewport.className = "project-viewport";
      const track = document.createElement("div");
      track.className = "project-track";
      list.forEach((span, index) => {
        const article = document.createElement("article");
        article.className = `project-slide${lead && index === 0 ? " is-lead" : ""}`;
        article.setAttribute("data-span", span);
        article.setAttribute("data-fixture", `${index}-${span}`);
        article.style.minHeight = "80px";
        track.appendChild(article);
      });
      viewport.appendChild(track);
      document.body.appendChild(viewport);
    },
    { list: spans, lead: markLead }
  );
}

async function fixtureWidths(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("#cms-span-fixture [data-fixture]")].map((node) => ({
      key: node.getAttribute("data-fixture"),
      span: node.getAttribute("data-span"),
      lead: node.classList.contains("is-lead"),
      width: node.getBoundingClientRect().width,
    }))
  );
}

test.describe("CMS card-size behavioral geometry", () => {
  test("live cards follow CMS span, not index", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openHome(page);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    const slides = page.locator("#projects [data-slide]");
    await expect(slides).toHaveCount(7);
    const expected = await expectedDesktop(page);
    const rendered = await slides.evaluateAll((nodes) =>
      nodes.map((node) => ({
        slug: node.getAttribute("data-project"),
        span: node.getAttribute("data-span"),
        lead: node.classList.contains("is-lead"),
        width: node.getBoundingClientRect().width,
      }))
    );

    const snapshotSlugs = portfolioSnapshot.projects.map((project) => project.slug);
    if (rendered.map((card) => card.slug).join() === snapshotSlugs.join()) {
      for (let i = 0; i < rendered.length; i += 1) {
        expect(rendered[i]?.span).toBe(portfolioSnapshot.projects[i]?.span);
      }
    }

    for (const card of rendered) {
      expect(SPANS).toContain(card.span);
      const span = card.span as keyof typeof expected;
      expect(Math.abs((card.width ?? 0) - expected[span])).toBeLessThan(3);
    }

    const first = rendered[0];
    if (first?.span && first.span !== "large") {
      expect(first.width ?? 0).toBeLessThan(expected.leadOverride - 8);
    }
  });

  test("fixture enumerates every span, positions, and combinations", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openHome(page);
    const expected = await expectedDesktop(page);

    const patterns: string[][] = [
      [...SPANS],
      ["small", "small", "small", "small"],
      ["large", "large", "large"],
      ["large", "small", "large", "small"],
      ["wide", "wide", "tall", "tall"],
      ["small", "tall", "wide", "large", "small"],
    ];

    for (const pattern of patterns) {
      await injectFixture(page, pattern);
      const rows = await fixtureWidths(page);
      expect(rows).toHaveLength(pattern.length);
      for (let i = 0; i < rows.length; i += 1) {
        const span = pattern[i] as keyof typeof expected;
        expect(rows[i]?.span).toBe(span);
        expect(Math.abs((rows[i]?.width ?? 0) - expected[span])).toBeLessThan(3);
      }
      const first = rows[0];
      const middle = rows[Math.floor(rows.length / 2)];
      const last = rows[rows.length - 1];
      if (first?.span) {
        expect(Math.abs((first.width ?? 0) - expected[first.span as keyof typeof expected])).toBeLessThan(3);
      }
      if (middle?.span) {
        expect(Math.abs((middle.width ?? 0) - expected[middle.span as keyof typeof expected])).toBeLessThan(3);
      }
      if (last?.span) {
        expect(Math.abs((last.width ?? 0) - expected[last.span as keyof typeof expected])).toBeLessThan(3);
      }
    }

    await injectFixture(page, ["small", "large"], true);
    const withLead = await fixtureWidths(page);
    expect(withLead[0]?.lead).toBe(true);
    expect(withLead[0]?.span).toBe("small");
    expect(Math.abs((withLead[0]?.width ?? 0) - expected.small)).toBeLessThan(3);
    expect((withLead[0]?.width ?? 0) + 8).toBeLessThan(expected.leadOverride);
  });

  test("span geometry across required viewports", async ({ page }) => {
    await openHome(page);
    const pattern = ["large", "small", "tall", "wide", "small"];

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await injectFixture(page, pattern);
      const rows = await fixtureWidths(page);
      expect(rows, `${viewport.width}x${viewport.height}`).toHaveLength(pattern.length);

      if (viewport.mode === "desktop") {
        const expected = await expectedDesktop(page);
        for (let i = 0; i < rows.length; i += 1) {
          const span = pattern[i] as keyof typeof expected;
          expect(
            Math.abs((rows[i]?.width ?? 0) - expected[span]),
            `${viewport.width} ${span} #${i}`
          ).toBeLessThan(4);
        }
        const large = rows.find((row) => row.span === "large")?.width ?? 0;
        const small = rows.find((row) => row.span === "small")?.width ?? 0;
        expect(large - small, `${viewport.width} large vs small`).toBeGreaterThan(8);
      } else {
        const widths = rows.map((row) => row.width ?? 0);
        const max = Math.max(...widths);
        const min = Math.min(...widths);
        expect(
          max - min,
          `${viewport.width} designed equal track, delta ${max - min}`
        ).toBeLessThan(8);
      }
    }
  });

  test("structural screenshots desktop / mobile / 1272", async ({ page }) => {
    const dir = path.join(process.cwd(), "tmp", "cms-behavior");
    mkdirSync(dir, { recursive: true });

    for (const viewport of [
      { name: "mobile", width: 390, height: 844 },
      { name: "1272", width: 1272, height: 900 },
      { name: "desktop", width: 1440, height: 900 },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openHome(page);
      await page.locator("#projects").scrollIntoViewIfNeeded();
      await expect(page.locator("#projects [data-slide]")).toHaveCount(7);
      await expect(page.locator("#projects [data-span]").first()).toBeVisible();
      await page.screenshot({
        path: path.join(dir, `portfolio-${viewport.name}.png`),
        fullPage: false,
      });
    }
  });
});
