import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars", "--no-first-run"],
});
const page = await browser.newPage();
await page.setViewport({
  width: 320,
  height: 568,
  deviceScaleFactor: 2,
  isMobile: true,
});
await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  localStorage.setItem("dtm-theme", "dark");
  document.documentElement.dataset.theme = "dark";
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => !document.querySelector(".page-loader"), {
  timeout: 5000,
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: "shots/320x568-closed.png" });
await page.click(".header-menu-toggle");
await page.waitForFunction(
  () =>
    document.querySelector(".mobile-menu")?.getAttribute("data-state") ===
    "open"
);
await page.mouse.move(0, 0);
await new Promise((r) => setTimeout(r, 450));
await page.screenshot({ path: "shots/320x568-open.png" });
const m = await page.evaluate(() => ({
  theme: document.documentElement.getAttribute("data-theme"),
  headerH: Math.round(
    document.querySelector(".site-header").getBoundingClientRect().height
  ),
  logoW: Math.round(
    document
      .querySelector(".site-header .dtm-lockup")
      .getBoundingClientRect().width
  ),
  dots: document.querySelectorAll(".mobile-menu-dot").length,
}));
console.log(m);
await browser.close();
