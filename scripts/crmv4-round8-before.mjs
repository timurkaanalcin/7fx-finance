/** Before shots: KPI cards, a dialog, and a toast. */
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
[data-crmv4-root][data-screen="kpi"] .shot-kpi,
[data-crmv4-root][data-screen="dialog"] .shot-dialog,
[data-crmv4-root][data-screen="toast"] .shot-toast{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-screen="kpi" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a></header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title">Overview</h1></div></div>
    <main class="c4-stage">
      <section class="shot shot-kpi">
        <div class="c4-kpis"><a class="c4-kpi"><p class="c4-kpi-label">Customers</p><p class="c4-kpi-value">128</p></a><a class="c4-kpi"><p class="c4-kpi-label">Net</p><p class="c4-kpi-value">$800</p></a></div>
        <div class="c4-bars"><div><div class="c4-row c4-between"><span>Deposits</span><span>12</span></div><div class="c4-bar" style="width:80%"></div></div></div>
      </section>
      <section class="shot shot-dialog"><div class="c4-sheet" style="position:relative"><h2 class="c4-title">Approve</h2><p>Optional reason</p><button class="c4-btn" type="button">Save</button></div></section>
      <section class="shot shot-toast"><div class="c4-toast" data-ok="1">Saved</div></section>
    </main><footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <nav class="c4-tabs"><a class="c4-tab" data-on="1">Overview</a></nav>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const shots = [
  { name: "crmv4-r8-before-kpi", screen: "kpi", width: 1440, height: 900 },
  { name: "crmv4-r8-before-dialog", screen: "dialog", width: 1440, height: 900 },
  { name: "crmv4-r8-before-toast", screen: "toast", width: 1440, height: 900 },
];
for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate((name) => { document.querySelector("[data-crmv4-root]").dataset.screen = name; }, shot.screen);
  await page.screenshot({ path: path.join(out, `${shot.name}.png`) });
  await page.close();
  console.log("saved", shot.name);
}
await browser.close();
