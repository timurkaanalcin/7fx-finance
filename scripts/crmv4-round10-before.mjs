/** Before shots: top bar, staff list, and audit log. */
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
[data-crmv4-root][data-screen="header"] .shot-header,
[data-crmv4-root][data-screen="staff"] .shot-staff,
[data-crmv4-root][data-screen="audit"] .shot-audit{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-screen="header" class="c4-app">
  <header class="c4-top">
    <a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a>
    <nav class="c4-nav">
      <a class="c4-nav-item" data-on="1"><span class="c4-nav-title">Overview</span><span class="c4-nav-sub">Desk</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Customers</span><span class="c4-nav-sub">Book</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Finance</span><span class="c4-nav-sub">Money</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Positions</span><span class="c4-nav-sub">Trades</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Support</span><span class="c4-nav-sub">Inbox</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Marketing</span><span class="c4-nav-sub">IB</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Logs</span><span class="c4-nav-sub">Audit</span></a>
    </nav>
  </header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="shot shot-header">
      <div class="c4-pagehead"><div><h1 class="c4-page-title">Control</h1><p class="c4-page-sub">Workers and audit</p></div>
        <form class="c4-page-search c4-search-luxe" role="search"><input class="c4-field" placeholder="Search" /></form>
      </div>
    </div>
    <main class="c4-stage">
      <section class="shot shot-staff"><section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Staff</h2></div>
        <ul>
          <li class="c4-row" style="justify-content:space-between;padding:8px 16px;border-top:1px solid var(--c4-line)"><div><div>Ada Demir</div><div class="c4-muted">ada@7fx.test · Desk lead</div></div><button class="c4-btn" type="button">Edit</button></li>
          <li class="c4-row" style="justify-content:space-between;padding:8px 16px;border-top:1px solid var(--c4-line)"><div><div>Ken Okonkwo</div><div class="c4-muted">ken@7fx.test · Retention</div></div><button class="c4-btn" type="button">Edit</button></li>
        </ul>
      </section></section>
      <section class="shot shot-audit"><section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Audit</h2></div>
        <ul>
          <li style="padding:8px 16px;border-top:1px solid var(--c4-line)"><div>freeze</div><div class="c4-muted">Ada · user-12</div></li>
          <li style="padding:8px 16px;border-top:1px solid var(--c4-line)"><div>note</div><div class="c4-muted">Ken · user-4</div></li>
        </ul>
      </section></section>
    </main>
    <footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const shots = [
  { name: "crmv4-r10-before-header", screen: "header", width: 1440, height: 900, theme: "light" },
  { name: "crmv4-r10-before-staff", screen: "staff", width: 1440, height: 900, theme: "light" },
  { name: "crmv4-r10-before-audit", screen: "audit", width: 1440, height: 900, theme: "light" },
  { name: "crmv4-r10-before-phone", screen: "staff", width: 375, height: 812, theme: "light" },
];
for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(({ screen, theme }) => {
    const root = document.querySelector("[data-crmv4-root]");
    root.dataset.screen = screen;
    root.dataset.theme = theme;
  }, shot);
  await page.screenshot({ path: path.join(out, `${shot.name}.png`) });
  await page.close();
  console.log("saved", shot.name);
}
await browser.close();
