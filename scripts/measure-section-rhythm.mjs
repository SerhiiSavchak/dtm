/**
 * Optical section rhythm: h2 top vs main content foot bottom (effective whitespace).
 * Run: node scripts/measure-section-rhythm.mjs [before|after]
 */
import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "414", width: 414, height: 896 },
  { name: "768", width: 768, height: 1024 },
  { name: "1366", width: 1366, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
];

const SECTIONS = [
  { id: "about", foot: "#about .grid.border-t" },
  { id: "projects", foot: "#projects .project-viewport" },
  { id: "services", foot: "#services ul[role='tablist']" },
  { id: "process", foot: "#process .process-rail" },
  { id: "in-progress", foot: "#in-progress .in-progress-board" },
  { id: "estimate", foot: "#estimate .calc-panel" },
  { id: "faq", foot: "#faq ul li:last-child" },
  { id: "contacts", foot: "#contacts .final-cta-block" },
];

function measure(page) {
  return page.evaluate((sections) => {
    return sections.map(({ id, foot }) => {
      const section =
        id === "contacts"
          ? document.querySelector("footer#contacts")
          : document.getElementById(id);
      if (!section) return { id, error: "missing" };

      const pad = section.querySelector(".section-pad, .section-pad-sm");
      if (!pad) return { id, error: "no pad" };
      const box = pad.getBoundingClientRect();

      const heading = pad.querySelector("h2");
      const footEl = pad.querySelector(foot);
      if (!heading) return { id, error: "no h2" };
      if (!footEl) return { id, error: "no foot", foot };

      const topRect = heading.getBoundingClientRect();
      const footRect = footEl.getBoundingClientRect();

      const effectiveTop = Math.max(0, topRect.top - box.top);
      const effectiveBottom = Math.max(0, box.bottom - footRect.bottom);

      const css = getComputedStyle(pad);
      const diff = effectiveBottom - effectiveTop;
      const pct =
        effectiveTop > 0 ? Math.round((diff / effectiveTop) * 100) : 0;

      return {
        id,
        effectiveTop: Math.round(effectiveTop),
        effectiveBottom: Math.round(effectiveBottom),
        diff: Math.round(diff),
        pct,
        cssPt: css.paddingTop,
        cssPb: css.paddingBottom,
      };
    });
  }, SECTIONS);
}

const label = process.argv[2] || "snapshot";
const outDir = path.join("tmp", "section-rhythm");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

const all = {};

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(300);

  for (const { id } of SECTIONS) {
    const sel = id === "contacts" ? "footer#contacts" : `#${id}`;
    await page.locator(sel).scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
  }

  all[vp.name] = await measure(page);
  await page.screenshot({
    path: path.join(outDir, `${label}-${vp.name}.png`),
    fullPage: true,
  });
}

writeFileSync(
  path.join(outDir, `${label}-measurements.json`),
  JSON.stringify(all, null, 2)
);
console.log(JSON.stringify(all, null, 2));
await browser.close();
