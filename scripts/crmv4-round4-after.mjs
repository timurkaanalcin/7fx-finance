/** After shots: luxury landing, settings, and the notification inbox. */
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
[data-crmv4-root][data-screen="landing"] .shot-landing,
[data-crmv4-root][data-screen="settings"] .shot-settings,
[data-crmv4-root][data-screen="inbox"] .shot-inbox{display:block !important}
</style></head><body>
<div data-crmv4-root data-theme="light" data-accent="champagne" data-screen="landing" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img alt="7FX" class="c4-logo fx-logo-ink" src="${logo}"/></a>
    <nav class="c4-nav">
      <a class="c4-nav-item" data-on="1"><span class="c4-nav-title">Overview</span><span class="c4-nav-sub">Desk</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Customers</span><span class="c4-nav-sub">Accounts</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Settings</span><span class="c4-nav-sub">Gear</span></a>
    </nav></header>
  <div class="c4-frame"><div class="c4-panel">
    <p class="c4-banner-note">Desk opens at 08:00. Deposits are being reviewed.</p>
    <div class="c4-pagehead"><div><h1 class="c4-page-title">Overview</h1><p class="c4-page-sub">Desk</p>
      <div class="c4-fresh"><span>Updated 09:40</span><button class="c4-btn" type="button">Refresh</button></div>
    </div></div>
    <main class="c4-stage">
      <section class="shot shot-landing">
        <section class="c4-landing"><p class="c4-landing-kicker">7FX</p><h2>Enter the desk</h2><p class="c4-muted">Signed in · Ada</p></section>
        <div class="c4-kpis">
          <div class="c4-kpi"><p class="c4-kpi-label">Customers</p><p class="c4-kpi-value">128</p></div>
          <div class="c4-kpi"><p class="c4-kpi-label">Pending</p><p class="c4-kpi-value">6</p></div>
        </div>
      </section>
      <section class="shot shot-settings c4-settings-luxe">
        <div class="c4-with-side">
          <nav class="c4-side"><button type="button" data-on="1">General</button><button type="button">Leads</button><button type="button">Desks</button></nav>
          <section class="c4-card"><div class="c4-card-h"><h2 class="c4-title">This browser</h2></div>
            <div class="c4-form" style="padding:16px">
              <div class="c4-row"><span>Accent</span><button class="c4-chip" data-on="1" type="button">Champagne</button><button class="c4-chip" type="button">Ivory</button><button class="c4-chip" type="button">Graphite</button></div>
              <label class="c4-lab"><span>Announcement</span><textarea class="c4-field">Desk opens at 08:00</textarea></label>
              <button class="c4-btn c4-btn-hot" type="button">Save</button>
            </div>
          </section>
        </div>
      </section>
      <section class="shot shot-inbox">
        <aside class="c4-drawer c4-inbox" style="position:relative;height:auto">
          <h2 class="c4-title">Notifications</h2>
          <div class="c4-note" data-unread="1" data-on="1"><div>Deposit pending</div><div class="c4-muted">Ada Demir · unread</div></div>
          <div class="c4-note"><div>KYC uploaded</div><div class="c4-muted">Leo Hart</div></div>
        </aside>
      </section>
    </main>
    <footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <aside class="c4-rail"><button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button></aside>
  <nav class="c4-tabs"><a class="c4-tab" data-on="1">Overview</a><a class="c4-tab">Customers</a><a class="c4-tab">More</a></nav>
</div></body></html>`;

const browser = await chromium.launch({ headless: true });
const shots = [
  { name: "crmv4-r4-after-landing", screen: "landing", width: 1440, height: 900 },
  { name: "crmv4-r4-after-settings", screen: "settings", width: 1440, height: 900 },
  { name: "crmv4-r4-after-inbox", screen: "inbox", width: 1440, height: 900 },
  { name: "crmv4-r4-after-landing-phone", screen: "landing", width: 375, height: 812 },
  { name: "crmv4-r4-after-settings-phone", screen: "settings", width: 375, height: 812 },
  { name: "crmv4-r4-after-inbox-phone", screen: "inbox", width: 375, height: 812 },
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
