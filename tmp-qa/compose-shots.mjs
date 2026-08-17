import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "c:/Users/intel/Documents/GitHub/dtm/tmp-qa/in-progress-compose";
const URL = "http://localhost:3000/";
const PORT = 9334;

fs.mkdirSync(OUT, { recursive: true });
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function cdp(ws, method, params = {}) {
  const id = cdp.nextId++;
  ws.send(JSON.stringify({ id, method, params }));
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
    `--user-data-dir=${path.join(OUT, ".chrome")}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

await wait(900);
const tabs = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
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

const viewports = [
  { w: 390, h: 844, dpr: 2 },
  { w: 430, h: 932, dpr: 2 },
  { w: 1024, h: 768, dpr: 1 },
  { w: 1200, h: 800, dpr: 1 },
  { w: 1440, h: 900, dpr: 1 },
  { w: 1920, h: 1080, dpr: 1 },
];

for (const vp of viewports) {
  await cdp(ws, "Emulation.setDeviceMetricsOverride", {
    width: vp.w,
    height: vp.h,
    deviceScaleFactor: vp.dpr,
    mobile: vp.w < 1024,
  });
  await cdp(ws, "Page.navigate", { url: URL });
  for (let i = 0; i < 40; i++) {
    const gone = await evalExpr(`!document.querySelector(".page-loader")`);
    if (gone) break;
    await wait(250);
  }
  await wait(400);
  const info = await evalExpr(`(async () => {
    const el = document.getElementById("in-progress");
    if (!el) return { err: "missing" };
    const head = el.querySelector(".section-head");
    const rule = el.querySelector(".arch-rule");
    const board = el.querySelector(".in-progress-board");
    const panels = [...el.querySelectorAll(".in-progress-panel")];
    const visible = panels.filter((p) => getComputedStyle(p).display !== "none");
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, top - 12));
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r, 1400));
    const boardBox = board?.getBoundingClientRect();
    return {
      mode: el.dataset.mode,
      hasHead: Boolean(head),
      hasRule: Boolean(rule),
      ruleW: rule ? Math.round(rule.getBoundingClientRect().width) : 0,
      panels: panels.length,
      visible: visible.length,
      boardH: board ? Math.round(board.getBoundingClientRect().height) : 0,
      boardW: board ? Math.round(board.getBoundingClientRect().width) : 0,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      open: board?.classList.contains("is-open"),
      armed: board?.classList.contains("is-armed"),
      sectionH: Math.round(el.offsetHeight),
      gap: board ? getComputedStyle(board).gap : "",
      boardTop: boardBox ? Math.round(boardBox.top) : null,
    };
  })()`);
  console.log(vp.w + "x" + vp.h, JSON.stringify(info));
  await wait(200);
  await shot(`${vp.w}-intro.png`);

  await evalExpr(`(async () => {
    const board = document.querySelector(".in-progress-board");
    if (!board) return;
    const y = board.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo(0, Math.max(0, y));
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r, 1100));
  })()`);
  await shot(`${vp.w}-board.png`);
}

ws.close();
chrome.kill();
console.log("done");
