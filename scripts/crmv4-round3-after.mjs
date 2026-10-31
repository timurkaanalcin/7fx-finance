/** After shots: trading book, calendar/tasks, and the nav rails. */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const css = fs.readFileSync(path.join(ROOT, "src/components/crmv4/crmv4.css"), "utf8");
const logo = pathToFileURL(path.join(ROOT, "public/7fx-logo.png")).href;
const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });

const days = Array.from({ length: 31 }, (_, index) => {
  const n = index + 1;
  const today = n === 31 ? ' data-today="1"' : "";
  const has = n === 12 || n === 18 ? ' data-has="1"' : "";
  return `<button type="button" class="c4-cal-day"${today}${has}><span>${n}</span></button>`;
}).join("");

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>${css} html,body{margin:0;height:100%;background:#f4f0e8}.fx-logo-ink{filter:brightness(0)}
[data-crmv4-root] .shot{display:none !important}
[data-crmv4-root][data-screen="positions"] .shot-positions,
[data-crmv4-root][data-screen="tasks"] .shot-tasks{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-screen="positions" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a>
    <nav class="c4-nav">
      <a class="c4-nav-item"><span class="c4-nav-title">Overview</span><span class="c4-nav-sub">Desk</span></a>
      <a class="c4-nav-item" data-on="1"><span class="c4-nav-title">Positions</span><span class="c4-nav-sub">Book</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Customers</span><span class="c4-nav-sub">Desk</span></a>
    </nav></header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title">Positions</h1><p class="c4-page-sub">Book</p></div></div>
    <main class="c4-stage">
      <section class="shot shot-positions">
        <div class="c4-book-grid">
          <section class="c4-card c4-book">
            <div class="c4-card-h"><h3 class="c4-title">Risk</h3></div>
            <div class="c4-funnel-row c4-risk-row"><span>EURUSD</span><div class="c4-risk-track"><div class="c4-bar" style="width:100%"></div></div><span class="c4-pl-pos">$40</span></div>
            <div class="c4-funnel-row c4-risk-row"><span>XAUUSD</span><div class="c4-risk-track"><div class="c4-bar" style="width:42%"></div></div><span class="c4-pl-neg">-$12</span></div>
          </section>
          <section class="c4-card c4-book">
            <div class="c4-card-h"><h3 class="c4-title">Margin watch</h3></div>
            <ul class="c4-watch"><li class="c4-watch-row">Leo Hart<span>80/100</span></li><li class="c4-watch-row">Ada Demir<span>420/500</span></li></ul>
          </section>
        </div>
        <div class="c4-desk c4-table-scroll c4-book">
          <table class="c4-table c4-table-luxe"><thead><tr><th>Customer</th><th>Symbol</th><th>Side</th><th>Volume</th><th>Profit</th></tr></thead>
          <tbody>
            <tr><td>Ada Demir</td><td class="c4-symbol">EURUSD</td><td data-side="BUY">BUY</td><td>1.2</td><td class="c4-pl-pos">40</td></tr>
            <tr><td>Leo Hart</td><td class="c4-symbol">XAUUSD</td><td data-side="SELL">SELL</td><td>0.4</td><td class="c4-pl-neg">-12</td></tr>
          </tbody></table>
        </div>
        <ul class="c4-mob-list"><li class="c4-card c4-book" style="margin:0 8px 8px;padding:12px"><div class="c4-row c4-between"><span class="c4-symbol">EURUSD · BUY</span><span class="c4-pl-pos">$40</span></div><div class="c4-muted">Ada Demir · Open</div></li></ul>
      </section>
      <section class="c4-tasks-luxe shot shot-tasks">
        <section class="c4-card">
          <div class="c4-card-h"><h2 class="c4-title">October 2026</h2></div>
          <div class="c4-cal-grid">
            <div class="c4-cal-wd">Sun</div><div class="c4-cal-wd">Mon</div><div class="c4-cal-wd">Tue</div><div class="c4-cal-wd">Wed</div><div class="c4-cal-wd">Thu</div><div class="c4-cal-wd">Fri</div><div class="c4-cal-wd">Sat</div>
            ${days}
          </div>
        </section>
        <section class="c4-card">
          <div class="c4-card-h"><h2 class="c4-title">Tasks</h2></div>
          <ul class="c4-timeline">
            <li><span class="c4-time-dot"></span><div>Call Ada back<div class="c4-muted">30 Oct · Callback</div></div></li>
            <li><span class="c4-time-dot"></span><div>KYC follow-up<div class="c4-muted">31 Oct · Documents</div></div></li>
          </ul>
        </section>
      </section>
    </main><footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <aside class="c4-rail">
    <button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button>
    <button class="c4-rail-btn" type="button"><span>Alerts</span></button>
    <button class="c4-rail-btn" type="button"><span>Toasts</span></button>
  </aside>
  <nav class="c4-tabs"><a class="c4-tab">Overview</a><a class="c4-tab" data-on="1">Positions</a><a class="c4-tab">Tasks</a></nav>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const shots = [
  { name: "crmv4-r3-after-positions", screen: "positions", width: 1440, height: 900 },
  { name: "crmv4-r3-after-tasks", screen: "tasks", width: 1440, height: 900 },
  { name: "crmv4-r3-after-positions-phone", screen: "positions", width: 375, height: 812 },
  { name: "crmv4-r3-after-tasks-phone", screen: "tasks", width: 375, height: 812 },
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
