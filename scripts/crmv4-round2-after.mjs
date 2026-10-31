/** After shots for the Finance queue, Support tickets, and the customer header. */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const css = fs.readFileSync(path.join(ROOT, "src/components/crmv4/crmv4.css"), "utf8");
const logo = pathToFileURL(path.join(ROOT, "public/7fx-logo.png")).href;
const outDir = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(outDir, { recursive: true });

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>${css}
html,body{margin:0;height:100%;background:#f4f0e8}
.fx-logo-ink{filter:brightness(0)}
[data-crmv4-root] .c4-shot{display:none !important}
[data-crmv4-root][data-screen="finance"] .c4-shot-finance,
[data-crmv4-root][data-screen="support"] .c4-shot-support,
[data-crmv4-root][data-screen="header"] .c4-shot-header{display:block !important}
</style></head>
<body>
<div data-crmv4-root data-theme="light" data-screen="finance" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img src="${logo}" alt="7FX" class="c4-logo fx-logo-ink"/></a>
    <nav class="c4-nav">
      <a class="c4-nav-item" data-nav="overview"><span class="c4-nav-title">Overview</span><span class="c4-nav-sub">Desk</span></a>
      <a class="c4-nav-item" data-nav="finance"><span class="c4-nav-title">Finance</span><span class="c4-nav-sub">Requests</span></a>
      <a class="c4-nav-item" data-nav="support"><span class="c4-nav-title">Support</span><span class="c4-nav-sub">Tickets</span></a>
    </nav>
  </header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title" id="h">Finance</h1><p class="c4-page-sub" id="s">Requests</p></div></div>
    <main class="c4-stage">
      <section class="c4-shot c4-shot-finance">
        <div class="c4-money-tools">
          <div class="c4-row"><button class="c4-chip" data-on="1" type="button">Last 7 days</button><button class="c4-chip" type="button">Last 30 days</button><button class="c4-btn" type="button">Compare</button></div>
          <p class="c4-compare">Period A $330 · Period B $80</p>
          <ul class="c4-queue">
            <li class="c4-queue-card" data-late="1"><label class="c4-row"><strong>Ada Demir</strong><span>$250</span><span class="c4-status" data-tone="bad">Pending</span><span class="c4-muted">Queue age 30h</span></label></li>
            <li class="c4-queue-card"><label class="c4-row"><strong>Leo Hart</strong><span>$80</span><span class="c4-status" data-tone="ok">Approved</span><span class="c4-muted">Queue age 4h</span></label></li>
          </ul>
          <div class="c4-row"><button class="c4-btn c4-btn-hot" type="button">Approve selected</button><button class="c4-btn c4-btn-coral" type="button">Reject selected</button></div>
        </div>
      </section>
      <section class="c4-shot c4-shot-support">
        <article class="c4-ticket c4-ticket-luxe">
          <div class="c4-row c4-between"><strong>Need a hand</strong><span class="c4-status" data-tone="warn">Pending</span></div>
          <p class="c4-muted c4-meta">Deposit</p>
          <div class="c4-row"><span class="c4-status" data-tone="bad">Age 30h · Overdue</span><span class="c4-tag">High</span></div>
          <hr class="c4-dashed"/>
          <div>$250 · 30 Oct</div>
        </article>
        <article class="c4-ticket c4-ticket-luxe">
          <div class="c4-row c4-between"><strong>Withdrawal check</strong><span class="c4-status" data-tone="ok">Approved</span></div>
          <div class="c4-row"><span class="c4-status" data-tone="info">Age 6h</span></div>
        </article>
      </section>
      <header class="c4-strip c4-strip-luxe c4-shot c4-shot-header">
        <a class="c4-btn c4-pill">Back</a>
        <div><h2>Ada Demir</h2><p class="c4-muted c4-meta">ada@desk.example · ID a1</p></div>
        <span class="c4-status" data-tone="ok">Active</span>
        <div class="c4-row"><button class="c4-btn c4-btn-hot" type="button">Open terminal</button><button class="c4-btn" type="button">Copy ID</button></div>
      </header>
    </main>
    <footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <aside class="c4-rail"><button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button></aside>
  <nav class="c4-tabs"><a class="c4-tab">Overview</a><a class="c4-tab" data-on="1">Finance</a><a class="c4-tab">Support</a></nav>
</div>
</body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
const shots = [
  { name: "crmv4-r2-after-finance", screen: "finance", width: 1440, height: 900 },
  { name: "crmv4-r2-after-support", screen: "support", width: 1440, height: 900 },
  { name: "crmv4-r2-after-header", screen: "header", width: 1440, height: 900 },
  { name: "crmv4-r2-after-finance-phone", screen: "finance", width: 375, height: 812 },
];
for (const shot of shots) {
  await page.setViewportSize({ width: shot.width, height: shot.height });
  await page.evaluate((screen) => {
    const root = document.querySelector("[data-crmv4-root]");
    root.dataset.screen = screen;
    const copy = { finance: ["Finance", "Requests"], support: ["Support", "Tickets"], header: ["Customers", "Accounts"] };
    document.getElementById("h").textContent = copy[screen][0];
    document.getElementById("s").textContent = copy[screen][1];
  }, shot.screen);
  await page.screenshot({ path: path.join(outDir, shot.name + ".png") });
  console.log("saved", shot.name);
}
await browser.close();
