import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000/";
const OUT = path.resolve("shots");

async function measure(page) {
  return page.evaluate(() => {
    const header = document.querySelector(".site-header");
    const logo = document.querySelector(".site-header .dtm-lockup");
    const burger = document.querySelector(".header-menu-toggle");
    const menu = document.querySelector(".mobile-menu");
    const links = [...document.querySelectorAll(".mobile-menu-link")];
    const inners = [...document.querySelectorAll(".mobile-menu-link-inner")];
    const dots = [...document.querySelectorAll(".mobile-menu-dot")];
    const cta = document.querySelector(".mobile-menu-cta");
    const util = document.querySelector(".mobile-menu-utility");
    const theme = document.querySelector(".mobile-menu-theme");
    const hr = header?.getBoundingClientRect();
    const lr = logo?.getBoundingClientRect();
    const br = burger?.getBoundingClientRect();
    const numbered = links.some((a) => /^\s*0\d/.test(a.textContent || ""));
    const social = !!document.querySelector(".mobile-menu-social, .mobile-menu a[href*='instagram'], .mobile-menu a[href*='t.me']");
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      headerH: hr ? Math.round(hr.height) : null,
      logoW: lr ? Math.round(lr.width) : null,
      logoH: lr ? Math.round(lr.height) : null,
      burgerHit: br ? [Math.round(br.width), Math.round(br.height)] : null,
      menuState: menu?.getAttribute("data-state"),
      linkCount: links.length,
      dotCount: dots.length,
      numbered,
      social,
      dots: dots.map((d) => {
        const r = d.getBoundingClientRect();
        return {
          w: Math.round(r.width * 10) / 10,
          h: Math.round(r.height * 10) / 10,
          x: Math.round(r.x),
          cx: Math.round(r.x + r.width / 2),
        };
      }),
      inners: inners.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          left: Math.round(r.left),
          right: Math.round(r.right),
          cx: Math.round(r.x + r.width / 2),
          w: Math.round(r.width),
        };
      }),
      labels: links.map((a) => (a.textContent || "").trim()),
      ctaH: cta ? Math.round(cta.getBoundingClientRect().height) : null,
      utilBottom: util ? Math.round(util.getBoundingClientRect().bottom) : null,
      navOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function runViewport(browser, { w, h, name }) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector(".site-header", { timeout: 15000 });
  await page.waitForFunction(
    () => !document.querySelector(".page-loader"),
    { timeout: 5000 }
  );
  await new Promise((r) => setTimeout(r, 400));
  await new Promise((r) => setTimeout(r, 600));

  const closedFile = await shot(page, `${name}-closed`);
  const closed = await measure(page);

  await page.click(".header-menu-toggle");
  await page.waitForFunction(
    () => document.querySelector(".mobile-menu")?.getAttribute("data-state") === "open"
  );
  await page.mouse.move(0, 0);
  await new Promise((r) => setTimeout(r, 450));
  const openFile = await shot(page, `${name}-open`);
  const open = await measure(page);

  await page.click(".mobile-menu-theme");
  await new Promise((r) => setTimeout(r, 350));
  const lightFile = await shot(page, `${name}-open-light`);

  await page.close();
  return { closedFile, openFile, lightFile, closed, open };
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--no-first-run"],
});

await mkdir(OUT, { recursive: true });

try {
  const r390 = await runViewport(browser, { w: 390, h: 844, name: "390x844" });
  const r320 = await runViewport(browser, { w: 320, h: 568, name: "320x568" });
  console.log(JSON.stringify({ r390, r320 }, null, 2));
} finally {
  await browser.close();
}
