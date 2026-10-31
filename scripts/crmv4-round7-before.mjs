/** Before shots: customer tabs, the money drawer, and the phone tab bar. */
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
[data-crmv4-root][data-screen="tabs"] .shot-tabs,
[data-crmv4-root][data-screen="drawer"] .shot-drawer,
[data-crmv4-root][data-screen="bar"] .shot-bar{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-screen="tabs" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a></header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title" id="h">Customer</h1></div></div>
    <main class="c4-stage">
      <section class="shot shot-tabs">
        <nav class="c4-side"><button type="button" data-on="1">Profile</button><button type="button">Notes</button><button type="button">Money</button><button type="button">Files</button></nav>
        <section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Profile</h2></div><p class="c4-pad">Ada Demir · TR</p></section>
      </section>
      <section class="shot shot-drawer"><aside class="c4-sheet" style="position:relative"><h2 class="c4-title">Approve</h2><p>Ada Demir · $250 · Pending</p><button class="c4-btn" type="button">Save</button></aside></section>
      <section class="shot shot-bar"></section>
    </main><footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <nav class="c4-tabs"><a class="c4-tab" data-on="1">Overview</a><a class="c4-tab">Customers</a><a class="c4-tab">Finance</a><a class="c4-tab">Support</a><button class="c4-tab" type="button">More</button></nav>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const shots = [
  { name: "crmv4-r7-before-tabs", screen: "tabs", width: 1440, height: 900 },
  { name: "crmv4-r7-before-drawer", screen: "drawer", width: 1440, height: 900 },
  { name: "crmv4-r7-before-bar", screen: "bar", width: 375, height: 812 },
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
