import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "c:/Users/intel/Documents/GitHub/dtm/tmp-qa/in-progress-shutters";
const URL = "http://localhost:3000/";
const PORT = 9333;

fs.mkdirSync(OUT, { recursive: true });

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function cdp(ws, method, params = {}, sessionId) {
  const id = cdp.nextId++;
  const msg = { id, method, params };
  if (sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout " + method)), 20000);
    cdp.pending.set(id, (res) => {
      clearTimeout(t);
      if (res.error) reject(new Error(method + " " + JSON.stringify(res.error)));
      else resolve(res.result);
    });
  });
}
cdp.nextId = 1;
cdp.pending = new Map();

const chrome = spawn(
  CHROME,
  [
    `--remote-debugging-port=${PORT}`,
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${path.join(OUT, ".chrome")}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

await wait(800);
const tabs = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) =>
  r.json()
);
const page = tabs.find((t) => t.type === "page") || tabs[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", reject);
});
ws.addEventListener("message", (ev) => {
  const data = JSON.parse(String(ev.data));
  if (data.id && cdp.pending.has(data.id)) {
    cdp.pending.get(data.id)(data);
    cdp.pending.delete(data.id);
  }
});

await cdp(ws, "Page.enable");
await cdp(ws, "Runtime.enable");

const viewports = [
  { w: 360, h: 800, dpr: 2 },
  { w: 390, h: 844, dpr: 2 },
  { w: 430, h: 932, dpr: 2 },
  { w: 578, h: 1024, dpr: 2 },
  { w: 768, h: 1024, dpr: 2 },
  { w: 1024, h: 768, dpr: 1 },
  { w: 1440, h: 900, dpr: 1 },
  { w: 1920, h: 1080, dpr: 1 },
];

async function shot(name) {
  const { data } = await cdp(ws, "Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  });
  fs.writeFileSync(path.join(OUT, name), Buffer.from(data, "base64"));
}

async function evalExpr(expression) {
  const res = await cdp(ws, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

for (const vp of viewports) {
  await cdp(ws, "Emulation.setDeviceMetricsOverride", {
    width: vp.w,
    height: vp.h,
    deviceScaleFactor: vp.dpr,
    mobile: vp.w < 1024,
  });
  await cdp(ws, "Page.navigate", { url: URL });
  await wait(1800);

  const info = await evalExpr(`(async () => {
    const el = document.getElementById("in-progress");
    if (!el) return { err: "no section" };
    const top = el.getBoundingClientRect().top + window.scrollY;
    const pin = el.querySelector(".in-progress-pin");
    const flow = el.querySelector(".in-progress-flow");
    const mode = el.dataset.mode;
    const pinH = pin ? pin.offsetHeight : 0;
    const flowH = flow ? flow.offsetHeight : 0;
    return {
      mode,
      top,
      pinH,
      flowH,
      sectionH: el.offsetHeight,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    };
  })()`);
  console.log(vp.w + "x" + vp.h, JSON.stringify(info));

  const startY = Math.max(0, (info.top || 0) - 8);
  await evalExpr(`window.scrollTo(0, ${startY}); window.dispatchEvent(new Event("scroll"));`);
  await wait(500);
  await shot(`${vp.w}-start.png`);

  const pinY = startY + Math.round(((info.sectionH || 800) - (info.pinH || info.flowH || 800)) * 0.2 + (info.pinH || info.flowH || 800) * 0.22);
  await evalExpr(`window.scrollTo(0, ${pinY}); window.dispatchEvent(new Event("scroll"));`);
  await wait(500);
  await shot(`${vp.w}-open.png`);

  const midY = startY + Math.round((info.sectionH || 800) * 0.48);
  await evalExpr(`window.scrollTo(0, ${midY}); window.dispatchEvent(new Event("scroll"));`);
  await wait(500);
  await shot(`${vp.w}-mid.png`);

  const endY = startY + Math.max(200, (info.sectionH || 800) - vp.h * 0.55);
  await evalExpr(`window.scrollTo(0, ${endY}); window.dispatchEvent(new Event("scroll"));`);
  await wait(500);
  await shot(`${vp.w}-end.png`);
}

await cdp(ws, "Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await cdp(ws, "Page.navigate", { url: URL });
await wait(1800);
await evalExpr(`document.documentElement.setAttribute("data-theme","light")`);
const light = await evalExpr(`(async () => {
  const el = document.getElementById("in-progress");
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top + el.offsetHeight * 0.42);
  return { top, h: el.offsetHeight, mode: el.dataset.mode };
})()`);
console.log("light", JSON.stringify(light));
await wait(600);
await shot("1440-light-mid.png");

ws.close();
chrome.kill();
console.log("done", OUT);
