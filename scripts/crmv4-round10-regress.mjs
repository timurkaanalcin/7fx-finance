/** Measure the v4 chrome at 375, 768, 1024, 1440, 1920 in light and dark. */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const css = fs.readFileSync(path.join(ROOT, "src/components/crmv4/crmv4.css"), "utf8");
const logo = pathToFileURL(path.join(ROOT, "public/7fx-logo.png")).href;
const nav = ["Overview", "Customers", "Finance", "Positions", "Support", "Marketing", "Logs"];
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}
html,body{margin:0;background:#f4f0e8}.fx-logo-ink{filter:brightness(0)}
</style></head><body>
<div data-crmv4-root data-theme="light" class="c4-app">
  <header class="c4-top">
    <a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a>
    <nav class="c4-nav">${nav.map((label, i) => `<a class="c4-nav-item" data-on="${i === 0 ? 1 : 0}"><span class="c4-nav-title">${label}</span><span class="c4-nav-sub">Desk</span></a>`).join("")}</nav>
    <div class="c4-top-tools"><button class="c4-rail-btn" type="button">⌘K</button><button class="c4-rail-btn" type="button">Alerts</button></div>
  </header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title">Customers</h1><p class="c4-page-sub">Accounts</p></div>
      <form class="c4-page-search"><input class="c4-field" placeholder="Search"/></form></div>
    <main class="c4-stage"><section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Staff</h2></div><p class="c4-pad">Ada · Desk</p></section></main>
  </div></div>
  <aside class="c4-rail"><button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button></aside>
  <nav class="c4-tabs"><a class="c4-tab" data-on="1">Overview</a><a class="c4-tab">Customers</a><a class="c4-tab">Finance</a><a class="c4-tab">Support</a><button class="c4-tab" type="button">More</button></nav>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const widths = [375, 768, 1024, 1440, 1920];
const themes = ["light", "dark"];
let bad = 0;
for (const width of widths) {
  for (const theme of themes) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate((name) => { document.querySelector("[data-crmv4-root]").dataset.theme = name; }, theme);
    const report = await page.evaluate(() => {
      const root = document.querySelector("[data-crmv4-root]");
      const overflow = root.scrollWidth - root.clientWidth;
      const logo = document.querySelector(".c4-logo").getBoundingClientRect();
      const title = document.querySelector(".c4-page-title").getBoundingClientRect();
      return { overflow, logoW: Math.round(logo.width), titleX: Math.round(title.x), rootW: root.clientWidth };
    });
    if (report.overflow > 1 || report.logoW < 20) {
      bad += 1;
      console.log("ISSUE", width, theme, JSON.stringify(report));
    } else console.log("ok", width, theme, report.overflow, "logo", report.logoW);
    await page.close();
  }
}
await browser.close();
if (bad) process.exitCode = 1;
