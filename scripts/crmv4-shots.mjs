/**
 * Visual check for CRM v4. Renders the real stylesheet at phone, tablet, and desktop sizes.
 * Run: node scripts/crmv4-shots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const css = fs.readFileSync(path.join(ROOT, "src/components/crmv4/crmv4.css"), "utf8");
const logo = pathToFileURL(path.join(ROOT, "public/7fx-logo.png")).href;
const outDir = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(outDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  ${css}
  html, body { margin: 0; height: 100%; background: #f7f4f0; }
  .fx-logo-paper { filter: none; }
  .fx-logo-ink { filter: brightness(0); }
  [data-crmv4-root] .c4-shot { display: none; }
  [data-crmv4-root][data-screen="overview"] .c4-shot-overview,
  [data-crmv4-root][data-screen="customers"] .c4-shot-customers,
  [data-crmv4-root][data-screen="support"] .c4-shot-support { display: flex; }
</style>
</head>
<body>
<div data-crmv4-root data-theme="light" data-screen="overview" class="c4-app">
  <header class="c4-top">
    <a class="c4-brand" href="#"><img src="${logo}" alt="7FX" class="c4-logo fx-logo-ink"/></a>
    <nav class="c4-nav" aria-label="Admin">
      <a class="c4-nav-item" data-on="1"><span class="c4-nav-title">Overview</span><span class="c4-nav-sub">Desk</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Customers</span><span class="c4-nav-sub">Accounts</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Finance</span><span class="c4-nav-sub">Requests</span><span class="c4-count">3</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Positions</span><span class="c4-nav-sub">Book</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Support</span><span class="c4-nav-sub">Tickets</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Marketing</span><span class="c4-nav-sub">Outreach</span></a>
      <a class="c4-nav-item"><span class="c4-nav-title">Logs</span><span class="c4-nav-sub">History</span></a>
      <button class="c4-nav-item c4-gear" type="button"><span class="c4-nav-title">⚙</span><span class="c4-nav-sub">Settings</span></button>
    </nav>
    <div class="c4-top-tools">
      <button class="c4-rail-btn" type="button" aria-label="Notifications"><span class="c4-rail-badge">2</span>🔔</button>
    </div>
  </header>
  <div class="c4-frame">
    <div class="c4-panel">
      <div class="c4-pagehead">
        <div>
          <h1 class="c4-page-title" id="heading">Overview</h1>
          <p class="c4-page-sub" id="sub">Desk</p>
        </div>
        <form class="c4-page-search"><input class="c4-field" aria-label="Search" placeholder="Search customer, ID, or transaction"/></form>
      </div>
      <main class="c4-stage">
        <div class="c4-stack c4-shot c4-shot-overview">
          <section class="c4-banner"><div class="c4-banner-value">$128,400</div><div class="c4-banner-label">Income</div></section>
          <div class="c4-kpis">
            <a class="c4-kpi" data-tone="violet"><p class="c4-kpi-label">Customers</p><p class="c4-kpi-value">128</p></a>
            <a class="c4-kpi" data-tone="cyan"><p class="c4-kpi-label">Assets under management</p><p class="c4-kpi-value">$2.4M</p></a>
            <a class="c4-kpi" data-tone="amber"><p class="c4-kpi-label">Volume</p><p class="c4-kpi-value">860</p></a>
            <a class="c4-kpi" data-tone="emerald"><p class="c4-kpi-label">Pending approvals</p><p class="c4-kpi-value">3</p></a>
          </div>
          <div class="c4-dash">
            <section class="c4-card">
              <div class="c4-card-h"><h2 class="c4-title">Mix</h2></div>
              <div class="c4-donut-wrap">
                <div class="c4-donut" style="background:conic-gradient(#2c3e6b 0 46%, #3d6cb3 46% 70%, #8a7a55 70% 82%, #3ebeb0 82% 100%)"></div>
                <ul class="c4-legend">
                  <li><i class="c4-swatch" style="background:#2c3e6b"></i>Deposit</li>
                  <li><i class="c4-swatch" style="background:#3d6cb3"></i>Withdraw</li>
                  <li><i class="c4-swatch" style="background:#8a7a55"></i>Transfer</li>
                  <li><i class="c4-swatch" style="background:#3ebeb0"></i>Credit</li>
                </ul>
              </div>
            </section>
            <section class="c4-card">
              <div class="c4-card-h"><h2 class="c4-title">Chart</h2></div>
              <div class="c4-bars">
                <div><div class="c4-row c4-between"><span>Deposit</span><span class="c4-pl-pos">84000</span></div><div class="c4-bar" style="width:100%"></div></div>
                <div><div class="c4-row c4-between"><span>Withdraw</span><span class="c4-pl-neg">21000</span></div><div class="c4-bar" style="width:42%"></div></div>
                <div><div class="c4-row c4-between"><span>Credit</span><span>6400</span></div><div class="c4-bar" style="width:18%"></div></div>
              </div>
            </section>
          </div>
          <section class="c4-card">
            <div class="c4-card-h"><h2 class="c4-title">October 2026</h2></div>
            <div class="c4-cal-h"><button class="c4-btn c4-pill" type="button">‹</button><button class="c4-btn" type="button">Today</button><button class="c4-btn c4-pill" type="button">›</button></div>
            <div class="c4-cal-grid">
              ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => `<div class="c4-cal-wd">${d}</div>`).join("")}
              ${Array.from({ length: 4 }, () => "<div></div>").join("")}
              ${Array.from({ length: 14 }, (_, i) => `<button class="c4-cal-day" type="button" data-today="${i === 12 ? "1" : "0"}" data-has="${i === 8 || i === 11 ? "1" : "0"}"><span>${i + 1}</span>${i === 8 ? "<em>Call back</em>" : ""}</button>`).join("")}
            </div>
          </section>
        </div>
        <div class="c4-stack c4-shot c4-shot-customers">
          <section class="c4-card">
            <div class="c4-card-h"><h2 class="c4-title">Customers</h2><span class="c4-muted">12</span></div>
            <div class="c4-presets">
              <span class="c4-chip">Active desks <button class="c4-preset-x" type="button">✎</button><button class="c4-preset-x" type="button">×</button></span>
              <button class="c4-btn" type="button">Save filters</button>
            </div>
            <div class="c4-tools">
              <button class="c4-btn" type="button">Hide filters</button>
              <button class="c4-btn" type="button">Clear filters</button>
              <button class="c4-btn" type="button">Table settings</button>
              <button class="c4-btn c4-btn-hot" type="button">Export</button>
            </div>
            <form class="c4-filters" data-open="1">
              <div class="c4-filter-span c4-row">
                <button class="c4-chip" data-on="1" type="button">Any</button>
                <button class="c4-chip" type="button">Active</button>
                <button class="c4-chip" type="button">Frozen</button>
              </div>
              <select class="c4-select" aria-label="Sale"><option>Sale</option></select>
              <select class="c4-select" aria-label="Country"><option>Country</option></select>
              <input class="c4-field" aria-label="Country" placeholder="Country"/>
              <button class="c4-btn c4-btn-hot" type="button">Apply</button>
            </form>
            <div class="c4-desk c4-table-wrap">
              <table class="c4-table">
                <thead><tr><th>Customer</th><th>Country</th><th>Desk</th><th>Sale</th><th>Balance</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td>Ada Demir<div class="c4-muted">ada@desk.example</div></td><td>TR</td><td>Desk 1</td><td><span class="c4-status" data-tone="info">New</span></td><td>$4,280</td><td><span class="c4-status" data-tone="ok">Active</span></td></tr>
                  <tr><td>Leo Hart<div class="c4-muted">leo@desk.example</div></td><td>GB</td><td>Desk 2</td><td><span class="c4-status" data-tone="warn">High potential</span></td><td>$910</td><td><span class="c4-status" data-tone="bad">Frozen</span></td></tr>
                  <tr><td>Mina Sol<div class="c4-muted">mina@desk.example</div></td><td>AE</td><td>Desk 1</td><td><span class="c4-status" data-tone="ok">Depositor</span></td><td>$12,040</td><td><span class="c4-status" data-tone="ok">Active</span></td></tr>
                </tbody>
              </table>
            </div>
            <ul class="c4-mob-list">
              <li><div class="c4-swipe-link"><div class="c4-row c4-between"><span>Ada Demir</span><span class="c4-status" data-tone="ok">Active</span></div><div class="c4-muted">ada@desk.example</div><div>$4,280 · New</div></div></li>
              <li><div class="c4-swipe-link"><div class="c4-row c4-between"><span>Leo Hart</span><span class="c4-status" data-tone="bad">Frozen</span></div><div class="c4-muted">leo@desk.example</div><div>$910 · Callback</div></div></li>
            </ul>
          </section>
        </div>
        <div class="c4-stack c4-shot c4-shot-support">
          <article class="c4-ticket">
            <div class="c4-row c4-between"><strong>Need a hand</strong><span class="c4-status" data-tone="warn">Pending</span></div>
            <p class="c4-muted c4-meta">Deposit</p>
            <hr class="c4-dashed"/>
            <div class="c4-swipe-link"><div>$250.00</div><div class="c4-muted">30 Oct 2026</div></div>
          </article>
          <article class="c4-ticket">
            <div class="c4-row c4-between"><strong>Withdrawal check</strong><span class="c4-status" data-tone="ok">Approved</span></div>
            <p class="c4-muted c4-meta">Withdraw</p>
            <hr class="c4-dashed"/>
            <div class="c4-swipe-link"><div>$80.00</div><div class="c4-muted">28 Oct 2026</div></div>
          </article>
        </div>
      </main>
      <footer class="c4-foot">7FX · All rights reserved</footer>
    </div>
  </div>
  <aside class="c4-rail">
    <button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button>
    <button class="c4-rail-btn" type="button"><span class="c4-rail-badge">2</span><span>Alerts</span></button>
    <button class="c4-rail-btn" type="button"><span>Remind</span></button>
    <button class="c4-rail-btn" type="button"><span>Notes</span></button>
    <button class="c4-rail-btn" type="button"><span>EN</span></button>
    <button class="c4-rail-btn" type="button"><span>Light</span></button>
    <button class="c4-rail-btn" type="button"><span>Out</span></button>
  </aside>
  <nav class="c4-tabs">
    <a class="c4-tab" data-on="1">Overview</a>
    <a class="c4-tab">Customers</a>
    <a class="c4-tab">Finance</a>
    <a class="c4-tab">Support</a>
    <button class="c4-tab" type="button">More</button>
  </nav>
</div>
</body>
</html>`;

const widths = [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1440];
const shots = [
  { name: "crmv4-desktop-light", width: 1440, height: 900, theme: "light", screen: "overview" },
  { name: "crmv4-desktop-dark", width: 1440, height: 900, theme: "dark", screen: "overview" },
  { name: "crmv4-tablet", width: 768, height: 1024, theme: "light", screen: "customers" },
  { name: "crmv4-phone-375", width: 375, height: 812, theme: "light", screen: "customers" },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
const problems = [];

for (const width of widths) {
  await page.setViewportSize({ width, height: 800 });
  for (const theme of ["light", "dark"]) {
    for (const screen of ["overview", "customers", "support"]) {
      const found = await page.evaluate(({ theme, screen }) => {
        const root = document.querySelector("[data-crmv4-root]");
        root.dataset.theme = theme;
        root.dataset.screen = screen;
        document.body.style.background = theme === "light" ? "#f7f4f0" : "#14110f";
        document.querySelectorAll("img").forEach((img) => {
          img.classList.toggle("fx-logo-ink", theme === "light");
          img.classList.toggle("fx-logo-paper", theme !== "light");
        });
        const doc = document.documentElement;
        const issues = [];
        if (doc.scrollWidth > doc.clientWidth + 1) issues.push("page-x " + doc.scrollWidth + ">" + doc.clientWidth);
        return issues;
      }, { theme, screen });
      if (found.length) problems.push(`${theme} ${screen} ${width}: ${found.join(" | ")}`);
    }
  }
}

for (const shot of shots) {
  await page.setViewportSize({ width: shot.width, height: shot.height });
  await page.evaluate((shot) => {
    const root = document.querySelector("[data-crmv4-root]");
    root.dataset.theme = shot.theme;
    root.dataset.screen = shot.screen;
    document.body.style.background = shot.theme === "light" ? "#f7f4f0" : "#14110f";
    const copy = {
      overview: ["Overview", "Desk"],
      customers: ["Customers", "Accounts"],
      support: ["Support", "Tickets"],
    };
    document.getElementById("heading").textContent = copy[shot.screen][0];
    document.getElementById("sub").textContent = copy[shot.screen][1];
    document.querySelectorAll("img").forEach((img) => {
      img.classList.toggle("fx-logo-ink", shot.theme === "light");
      img.classList.toggle("fx-logo-paper", shot.theme !== "light");
    });
    document.querySelectorAll(".c4-tab").forEach((el) => {
      el.dataset.on = el.textContent === copy[shot.screen][0] ? "1" : "0";
    });
    document.querySelectorAll(".c4-nav-item").forEach((el) => {
      const title = el.querySelector(".c4-nav-title");
      el.dataset.on = title && title.textContent === copy[shot.screen][0] ? "1" : "0";
    });
    window.scrollTo(0, 0);
  }, shot);
  await page.screenshot({ path: path.join(outDir, shot.name + ".png"), fullPage: false });
  console.log("saved", shot.name);
}

await browser.close();
if (problems.length) {
  console.log("OVERFLOW");
  for (const line of problems) console.log(line);
  process.exit(1);
}
console.log("viewport sweep clean");
