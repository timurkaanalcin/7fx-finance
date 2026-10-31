/**
 * Visual check for CRM v3. Renders the real stylesheet at phone, tablet, and desktop sizes.
 * Run: node scripts/crmv3-shots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const css = fs.readFileSync(path.join(ROOT, "src/components/crmv3/crmv3.css"), "utf8");
const logo = path.join(ROOT, "public/7fx-logo.png");
const outDir = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(outDir, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  ${css}
  html, body { margin: 0; background: #0e0e0c; }
  .fx-logo-paper { filter: none; }
  .fx-logo-ink { filter: brightness(0); }
  [data-crmv3-root] .c3-stage[data-panel] { display: none; }
  [data-crmv3-root][data-screen="overview"] .c3-stage[data-panel="overview"],
  [data-crmv3-root][data-screen="customers"] .c3-stage[data-panel="customers"],
  [data-crmv3-root][data-screen="money"] .c3-stage[data-panel="money"],
  [data-crmv3-root][data-screen="support"] .c3-stage[data-panel="support"] { display: flex; }
</style>
</head>
<body>
<div data-crmv3-root data-theme="dark" data-screen="overview">
  <aside class="c3-rail">
    <div class="c3-rail-brand"><img src="${logo}" alt="7FX" class="c3-logo fx-logo-paper"/><span>CRM v3</span></div>
    <nav>
      <a class="c3-nav" data-on="1">Overview</a>
      <a class="c3-nav">Customers</a>
      <a class="c3-nav">Money</a>
      <a class="c3-nav">Positions</a>
      <a class="c3-nav">Support</a>
      <a class="c3-nav">Marketing</a>
      <a class="c3-nav">Settings</a>
      <a class="c3-nav">Logs</a>
      <a class="c3-nav">Control</a>
    </nav>
    <div class="c3-rail-foot"><p class="c3-muted c3-meta">Signed in as<span class="c3-value">Admin</span></p><button class="c3-btn" type="button">Sign out</button></div>
  </aside>
  <div class="c3-body">
    <header class="c3-header">
      <img src="${logo}" alt="7FX" class="c3-logo fx-logo-paper"/>
      <div class="c3-header-copy"><p class="c3-kicker">CRM v3</p><h1 class="c3-heading" id="heading">Overview</h1></div>
      <form class="c3-header-search"><input class="c3-field" aria-label="Search" placeholder="Search customer, ID, or transaction" value=""/></form>
      <button class="c3-fab" type="button" aria-label="Search">⌕</button>
      <button class="c3-icon-btn" type="button" aria-label="Light">Lt</button>
      <button class="c3-icon-btn" type="button" aria-label="Notifications">2</button>
    </header>
    <main class="c3-main">
      <div class="c3-stage" data-panel="overview">
        <div class="c3-row"><button class="c3-chip" data-on="1" type="button">Overview</button><button class="c3-chip" type="button">Insights</button></div>
        <p class="c3-muted">Live desk totals, newest customers, and money waiting for a decision.</p>
        <div class="c3-kpis">
          <a class="c3-kpi"><p class="c3-kpi-label">Customers</p><p class="c3-kpi-value">128</p></a>
          <a class="c3-kpi"><p class="c3-kpi-label">Assets under management</p><p class="c3-kpi-value">$2.4M</p></a>
          <a class="c3-kpi"><p class="c3-kpi-label">Volume</p><p class="c3-kpi-value">860</p></a>
          <a class="c3-kpi"><p class="c3-kpi-label">Pending approvals</p><p class="c3-kpi-value">3</p></a>
        </div>
        <div class="c3-split">
          <section class="c3-card">
            <div class="c3-card-h"><h2 class="c3-title">Newest customers</h2><a>See all</a></div>
            <div class="c3-swipe"><div class="c3-swipe-actions"><button class="c3-btn" data-tone="gold" type="button">Open</button></div>
              <div class="c3-swipe-face"><div class="c3-swipe-link"><div class="c3-row c3-between"><span>Ada Demir</span><span class="c3-status" data-tone="ok">Active</span></div><div class="c3-muted">ada@desk.example</div><div>$4,280.00 · New</div></div></div>
            </div>
            <div class="c3-swipe"><div class="c3-swipe-actions"><button class="c3-btn" data-tone="gold" type="button">Open</button></div>
              <div class="c3-swipe-face"><div class="c3-swipe-link"><div class="c3-row c3-between"><span>Leo Hart</span><span class="c3-status" data-tone="bad">Frozen</span></div><div class="c3-muted">leo@desk.example</div><div>$910.00 · Callback</div></div></div>
            </div>
          </section>
          <div class="c3-stack">
            <section class="c3-card"><div class="c3-card-h"><h2 class="c3-title">Quick actions</h2></div><div class="c3-row c3-pad"><button class="c3-btn c3-btn-hot" type="button">Add customer</button><button class="c3-btn" type="button">Export</button><button class="c3-btn" type="button">Transfer</button></div></section>
            <section class="c3-card"><div class="c3-card-h"><h2 class="c3-title">Live alerts</h2></div><div class="c3-pad"><span class="c3-status" data-tone="warn">Pending approvals: 3</span></div></section>
          </div>
        </div>
      </div>
      <div class="c3-stage" data-panel="customers">
        <section class="c3-card">
          <div class="c3-card-h"><h2 class="c3-title">Customers</h2><span class="c3-muted">Total 128</span></div>
          <div class="c3-tools"><button class="c3-chip" data-on="1" type="button">Any</button><button class="c3-chip" type="button">Active</button><button class="c3-chip" type="button">Frozen</button><button class="c3-btn c3-btn-hot" type="button">Apply</button></div>
          <div class="c3-swipe"><div class="c3-swipe-actions"><button class="c3-btn" data-tone="gold" type="button">Open</button></div>
            <div class="c3-swipe-face"><div class="c3-swipe-link"><div class="c3-row c3-between"><span>Noor Ali</span><span class="c3-status" data-tone="ok">Active</span></div><div class="c3-muted">noor@desk.example</div><div>$12,400.00 · FTD</div></div></div>
          </div>
          <div class="c3-swipe"><div class="c3-swipe-actions"><button class="c3-btn" data-tone="gold" type="button">Open</button></div>
            <div class="c3-swipe-face"><div class="c3-swipe-link"><div class="c3-row c3-between"><span>Mina Vogel</span><span class="c3-status" data-tone="info">Retention</span></div><div class="c3-muted">mina@desk.example</div><div>$640.00</div></div></div>
          </div>
        </section>
      </div>
      <div class="c3-stage" data-panel="money">
        <section class="c3-card">
          <div class="c3-card-h"><h2 class="c3-title">Transactions</h2></div>
          <div class="c3-tools"><button class="c3-chip" data-on="1" type="button">Deposits</button><button class="c3-chip" type="button">Withdrawals</button><button class="c3-chip" type="button">Balance requests</button><button class="c3-chip" type="button">Ledger</button><button class="c3-chip" data-on="1" type="button">Pending</button></div>
          <div class="c3-swipe"><div class="c3-swipe-actions"><button class="c3-btn" data-tone="ok" type="button">Approve</button><button class="c3-btn" data-tone="bad" type="button">Reject</button></div>
            <div class="c3-swipe-face"><div class="c3-swipe-link"><div class="c3-row c3-between"><span>Ada Demir</span><span class="c3-status" data-tone="warn">PENDING</span></div><div class="c3-muted">$2,500.00 · Wire</div></div></div>
          </div>
          <div class="c3-swipe"><div class="c3-swipe-actions"><button class="c3-btn" data-tone="ok" type="button">Approve</button><button class="c3-btn" data-tone="bad" type="button">Reject</button></div>
            <div class="c3-swipe-face"><div class="c3-swipe-link"><div class="c3-row c3-between"><span>Leo Hart</span><span class="c3-status" data-tone="warn">PENDING</span></div><div class="c3-muted">$800.00 · Card</div></div></div>
          </div>
        </section>
        <section class="c3-card c3-sheet" style="position:relative;max-height:none">
          <div class="c3-grab"></div>
          <div class="c3-row c3-between"><h2 class="c3-title">Approve</h2><button class="c3-btn" type="button">Close</button></div>
          <label class="c3-lab">Approval reason (optional)<textarea class="c3-field" aria-required="false" rows="3"></textarea></label>
          <p class="c3-muted">Leave this blank if you do not need a reason.</p>
          <button class="c3-btn c3-btn-hot" type="button">Save</button>
        </section>
      </div>
      <div class="c3-stage" data-panel="support">
        <div class="c3-row"><button class="c3-chip" data-on="1" type="button">Tickets</button><button class="c3-chip" type="button">Live chat</button><button class="c3-chip" type="button">KYC</button><button class="c3-chip" type="button">Files</button></div>
        <section class="c3-card">
          <div class="c3-swipe"><div class="c3-swipe-actions"><button class="c3-btn" data-tone="ok" type="button">Approve</button><button class="c3-btn" data-tone="bad" type="button">Reject</button></div>
            <div class="c3-swipe-face"><div class="c3-swipe-link"><div class="c3-row c3-between"><span>Mina Vogel · DEPOSIT</span><span class="c3-status" data-tone="warn">PENDING</span></div><div class="c3-muted">$1,200.00</div></div></div>
          </div>
          <div class="c3-empty"><span class="c3-empty-mark"></span><p>Nothing matches</p></div>
        </section>
      </div>
    </main>
  </div>
  <nav class="c3-tabs" aria-label="Admin">
    <a class="c3-tab" data-tab="overview" data-on="1">Overview</a>
    <a class="c3-tab" data-tab="customers">Customers</a>
    <a class="c3-tab" data-tab="finance">Money</a>
    <a class="c3-tab" data-tab="support">Support</a>
    <button class="c3-tab" type="button">More</button>
  </nav>
</div>
</body>
</html>`;

const file = path.join(outDir, "crmv3-preview.html");
fs.writeFileSync(file, html);

const widths = [320, 360, 375, 390, 414, 430, 768, 820, 1024];
const screens = ["overview", "customers", "money", "support"];

function box(width, landscape) {
  const tall = width <= 430 ? Math.round(width * 2.16) : width < 1024 ? Math.round(width * 1.4) : 1366;
  return landscape ? { width: tall, height: width } : { width, height: tall };
}

const shots = [
  { name: "crmv3-overview-375-dark", width: 375, height: 812, theme: "dark", screen: "overview" },
  { name: "crmv3-overview-430-dark", width: 430, height: 932, theme: "dark", screen: "overview" },
  { name: "crmv3-overview-820-dark", width: 820, height: 1180, theme: "dark", screen: "overview" },
  { name: "crmv3-overview-1440-dark", width: 1440, height: 900, theme: "dark", screen: "overview" },
  { name: "crmv3-overview-1440-light", width: 1440, height: 900, theme: "light", screen: "overview" },
  { name: "crmv3-customers-375-dark", width: 375, height: 812, theme: "dark", screen: "customers" },
  { name: "crmv3-money-375-light", width: 375, height: 812, theme: "light", screen: "money" },
  { name: "crmv3-support-430-dark", width: 430, height: 932, theme: "dark", screen: "support" },
];

const browser = await chromium.launch({ executablePath: "/usr/local/bin/google-chrome", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("file://" + file);

const problems = [];
for (const theme of ["dark", "light"]) {
  for (const screen of screens) {
    for (const width of widths) {
      for (const landscape of [false, true]) {
        const size = box(width, landscape);
        await page.setViewportSize(size);
        const found = await page.evaluate(({ theme, screen }) => {
          const root = document.querySelector("[data-crmv3-root]");
          root.dataset.theme = theme;
          root.dataset.screen = screen;
          document.body.style.background = theme === "light" ? "#f4f1ea" : "#0e0e0c";
          const tab = screen === "money" ? "finance" : screen;
          document.querySelectorAll(".c3-tab").forEach((el) => {
            el.dataset.on = el.dataset.tab === tab ? "1" : "0";
          });
          document.querySelectorAll("img").forEach((img) => {
            img.classList.toggle("fx-logo-ink", theme === "light");
            img.classList.toggle("fx-logo-paper", theme !== "light");
          });
          const heading = { overview: "Overview", customers: "Customers", money: "Money", support: "Support" };
          document.getElementById("heading").textContent = heading[screen];
          const doc = document.documentElement;
          const issues = [];
          if (doc.scrollWidth > doc.clientWidth + 1) issues.push("page-x " + doc.scrollWidth + ">" + doc.clientWidth);
          document.querySelectorAll(".c3-tab, .c3-heading, .c3-kicker, .c3-btn, .c3-chip, .c3-kpi-value, .c3-status").forEach((el) => {
            const style = getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") return;
            if (el.scrollWidth > el.clientWidth + 2) issues.push((el.className || el.tagName) + " clip " + el.textContent.trim().slice(0, 24));
          });
          return issues;
        }, { theme, screen });
        if (found.length) problems.push(`${theme} ${screen} ${size.width}x${size.height}: ${found.join(" | ")}`);
      }
    }
  }
}

for (const shot of shots) {
  await page.setViewportSize({ width: shot.width, height: shot.height });
  await page.evaluate((shot) => {
    const root = document.querySelector("[data-crmv3-root]");
    root.dataset.theme = shot.theme;
    root.dataset.screen = shot.screen;
    document.body.style.background = shot.theme === "light" ? "#f4f1ea" : "#0e0e0c";
    const tab = shot.screen === "money" ? "finance" : shot.screen;
    document.querySelectorAll(".c3-tab").forEach((el) => {
      el.dataset.on = el.dataset.tab === tab ? "1" : "0";
    });
    document.querySelectorAll("img").forEach((img) => {
      img.classList.toggle("fx-logo-ink", shot.theme === "light");
      img.classList.toggle("fx-logo-paper", shot.theme !== "light");
    });
    const heading = { overview: "Overview", customers: "Customers", money: "Money", support: "Support" };
    document.getElementById("heading").textContent = heading[shot.screen];
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
