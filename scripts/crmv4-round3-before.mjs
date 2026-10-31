/** Before shots: positions, tasks, and the nav rails. */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const css = fs.readFileSync(path.join(ROOT, "src/components/crmv4/crmv4.css"), "utf8");
const logo = pathToFileURL(path.join(ROOT, "public/7fx-logo.png")).href;
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>${css} html,body{margin:0;height:100%;background:#f4f0e8}.fx-logo-ink{filter:brightness(0)}
[data-crmv4-root] .shot{display:none !important}
[data-crmv4-root][data-screen="positions"] .shot-positions,
[data-crmv4-root][data-screen="tasks"] .shot-tasks{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-screen="positions" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a>
    <nav class="c4-nav"><a class="c4-nav-item" data-on="1"><span class="c4-nav-title">Positions</span><span class="c4-nav-sub">Book</span></a>
    <a class="c4-nav-item"><span class="c4-nav-title">Overview</span><span class="c4-nav-sub">Desk</span></a></nav></header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title" id="h">Positions</h1><p class="c4-page-sub">Book</p></div></div>
    <main class="c4-stage">
      <section class="c4-card shot shot-positions"><div class="c4-card-h"><h2 class="c4-title">Positions</h2></div>
        <div class="c4-tools"><button class="c4-chip" data-on="1" type="button">Open</button><button class="c4-chip" type="button">Closed</button></div>
        <table class="c4-table"><thead><tr><th>Customer</th><th>Symbol</th><th>Side</th><th>Volume</th><th>Profit</th></tr></thead>
        <tbody><tr><td>Ada Demir</td><td>EURUSD</td><td>BUY</td><td>1.2</td><td class="c4-pl-pos">40</td></tr>
        <tr><td>Leo Hart</td><td>XAUUSD</td><td>SELL</td><td>0.4</td><td class="c4-pl-neg">-12</td></tr></tbody></table>
      </section>
      <section class="c4-card shot shot-tasks"><div class="c4-card-h"><h2 class="c4-title">Tasks</h2></div>
        <ul class="c4-timeline"><li><span class="c4-time-dot"></span><div>Call back<div class="c4-muted">30 Oct</div></div></li></ul>
      </section>
    </main><footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <aside class="c4-rail"><button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button>
    <button class="c4-rail-btn" type="button"><span>Alerts</span></button></aside>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.setContent(html, { waitUntil: "load" });
for (const screen of ["positions", "tasks"]) {
  await page.evaluate((name) => { document.querySelector("[data-crmv4-root]").dataset.screen = name; }, screen);
  await page.screenshot({ path: path.join(out, `crmv4-r3-before-${screen}.png`) });
  console.log("saved", screen);
}
await browser.close();
