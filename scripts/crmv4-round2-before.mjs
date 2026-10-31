/** Before shots for Finance, Support, and the customer header. Uses the CSS as it is now. */
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
<style>${css} html,body{margin:0;height:100%;background:#f4f0e8}.fx-logo-ink{filter:brightness(0)}</style></head>
<body>
<div data-crmv4-root data-theme="light" data-screen="finance" class="c4-app">
  <header class="c4-top"><a class="c4-brand"><img src="${logo}" alt="7FX" class="c4-logo fx-logo-ink"/></a>
    <nav class="c4-nav"><a class="c4-nav-item"><span class="c4-nav-title">Overview</span><span class="c4-nav-sub">Desk</span></a>
    <a class="c4-nav-item" data-on="1"><span class="c4-nav-title">Finance</span><span class="c4-nav-sub">Requests</span></a></nav>
  </header>
  <div class="c4-frame"><div class="c4-panel">
    <div class="c4-pagehead"><div><h1 class="c4-page-title" id="h">Finance</h1><p class="c4-page-sub" id="s">Requests</p></div></div>
    <main class="c4-stage">
      <section class="c4-card c4-shot c4-shot-finance">
        <div class="c4-card-h"><h2 class="c4-title">Transactions</h2></div>
        <div class="c4-tools"><button class="c4-chip" data-on="1" type="button">Deposits</button><button class="c4-chip" type="button">Withdrawals</button><button class="c4-chip" type="button">Pending</button></div>
        <div class="c4-desk"><table class="c4-table"><thead><tr><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody><tr><td>Ada Demir</td><td>$250</td><td><span class="c4-status" data-tone="warn">Pending</span></td></tr>
        <tr><td>Leo Hart</td><td>$80</td><td><span class="c4-status" data-tone="ok">Approved</span></td></tr></tbody></table></div>
      </section>
      <section class="c4-card c4-shot c4-shot-support" style="display:none">
        <article class="c4-ticket"><div class="c4-row c4-between"><strong>Need a hand</strong><span class="c4-status" data-tone="warn">Pending</span></div><p class="c4-muted">Deposit</p><hr class="c4-dashed"/><div>$250 · 30 Oct</div></article>
      </section>
      <header class="c4-strip c4-shot c4-shot-header" style="display:none">
        <a class="c4-btn c4-pill">Back</a><div><h2>Ada Demir</h2><p class="c4-muted">ada@desk.example · ID a1</p></div>
        <span class="c4-status" data-tone="ok">Active</span>
        <button class="c4-btn c4-btn-hot" type="button">Open terminal</button>
      </header>
    </main>
    <footer class="c4-foot">7FX · All rights reserved</footer>
  </div></div>
  <aside class="c4-rail"><button class="c4-rail-btn" type="button"><span class="c4-avatar">A</span><span>Admin</span></button></aside>
</div>
<script>
  const screen = new URLSearchParams(location.search).get("screen") || "finance";
  document.querySelectorAll(".c4-shot").forEach((el) => { el.style.display = el.classList.contains("c4-shot-" + screen) ? "" : "none"; });
  const copy = { finance: ["Finance", "Requests"], support: ["Support", "Tickets"], header: ["Customers", "Accounts"] };
  document.getElementById("h").textContent = copy[screen][0];
  document.getElementById("s").textContent = copy[screen][1];
</script>
</body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.setContent(html, { waitUntil: "load" });
for (const screen of ["finance", "support", "header"]) {
  await page.evaluate((name) => {
    document.querySelectorAll(".c4-shot").forEach((el) => {
      el.style.display = el.classList.contains("c4-shot-" + name) ? "block" : "none";
    });
    const copy = { finance: ["Finance", "Requests"], support: ["Support", "Tickets"], header: ["Customers", "Accounts"] };
    document.getElementById("h").textContent = copy[name][0];
    document.getElementById("s").textContent = copy[name][1];
    document.querySelectorAll(".c4-nav-item").forEach((el, i) => { el.dataset.on = (name === "finance" ? i === 1 : i === 0) ? "1" : "0"; });
  }, screen);
  const file = path.join(outDir, `crmv4-r2-before-${screen}.png`);
  await page.screenshot({ path: file });
  console.log("saved", file);
}
await browser.close();
