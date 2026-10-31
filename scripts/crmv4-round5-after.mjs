/** After shots: affiliates, logs, and the report in the luxury desk. */
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
[data-crmv4-root][data-screen="affiliates"] .shot-affiliates,
[data-crmv4-root][data-screen="logs"] .shot-logs,
[data-crmv4-root][data-screen="report"] .shot-report{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-accent="champagne" data-screen="affiliates" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a>
    <nav class="c4-nav"><a class="c4-nav-item" data-on="1"><span class="c4-nav-title">Marketing</span><span class="c4-nav-sub">Outreach</span></a></nav></header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title" id="h">Affiliates</h1><p class="c4-page-sub">Outreach</p></div></div>
    <main class="c4-stage">
      <section class="shot shot-affiliates c4-aff-luxe"><section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Affiliates</h2></div>
        <ul><li>North Desk · Leads 12</li><li>Harbor IB · Leads 4</li></ul>
      </section></section>
      <section class="shot shot-logs c4-logs-luxe"><section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Logs</h2></div>
        <ul><li>CALL · Ada Demir<div class="c4-muted">30 Oct · Mira</div></li><li>NOTE · Leo Hart<div class="c4-muted">29 Oct · Audit</div></li></ul>
      </section></section>
      <section class="shot shot-report c4-report-luxe">
        <svg class="c4-mini" viewBox="0 0 120 32" aria-label="Net"><path d="M0 24 L40 16 L80 20 L120 6"/></svg>
        <div class="c4-kpis"><div class="c4-kpi"><p class="c4-kpi-label">Income</p><p class="c4-kpi-value">$1,200</p></div><div class="c4-kpi"><p class="c4-kpi-label">Net</p><p class="c4-kpi-value">$800</p></div></div>
        <section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">Forecast</h2></div><p class="c4-pad">$900 · $980 · $1,060</p></section>
      </section>
    </main><footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <aside class="c4-rail"><button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button></aside>
  <nav class="c4-tabs"><a class="c4-tab" data-on="1">More</a></nav>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const shots = [
  { name: "crmv4-r5-after-affiliates", screen: "affiliates", width: 1440, height: 900 },
  { name: "crmv4-r5-after-logs", screen: "logs", width: 1440, height: 900 },
  { name: "crmv4-r5-after-report", screen: "report", width: 1440, height: 900 },
  { name: "crmv4-r5-after-affiliates-phone", screen: "affiliates", width: 375, height: 812 },
  { name: "crmv4-r5-after-logs-phone", screen: "logs", width: 375, height: 812 },
  { name: "crmv4-r5-after-report-phone", screen: "report", width: 375, height: 812 },
];
for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: shot.height } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate((name) => {
    const root = document.querySelector("[data-crmv4-root]");
    root.dataset.screen = name;
    const title = { affiliates: "Affiliates", logs: "Logs", report: "Report" }[name];
    document.getElementById("h").textContent = title;
  }, shot.screen);
  await page.screenshot({ path: path.join(out, `${shot.name}.png`) });
  await page.close();
  console.log("saved", shot.name);
}
await browser.close();
