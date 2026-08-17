import puppeteer from "puppeteer-core";

const sizes = [
  [360, 640],
  [375, 667],
  [430, 932],
  [768, 1024],
  [1280, 800],
];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars", "--no-first-run"],
});

const out = [];
for (const [w, h] of sizes) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 1280 });
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".site-header", { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector(".page-loader"), { timeout: 5000 }).catch(() => {});
  const m = await page.evaluate(() => {
    const header = document.querySelector(".site-header");
    const logo = document.querySelector(".site-header .dtm-lockup");
    const burger = document.querySelector(".header-menu-toggle");
    const desktopNav = document.querySelector(".site-header nav");
    const cs = burger ? getComputedStyle(burger) : null;
    const ncs = desktopNav ? getComputedStyle(desktopNav) : null;
    return {
      vw: innerWidth,
      headerH: header ? Math.round(header.getBoundingClientRect().height) : null,
      logoW: logo ? Math.round(logo.getBoundingClientRect().width) : null,
      burgerDisplay: cs?.display,
      desktopNavDisplay: ncs?.display,
    };
  });
  out.push({ w, h, ...m });
  await page.close();
}
console.log(JSON.stringify(out, null, 2));
await browser.close();
