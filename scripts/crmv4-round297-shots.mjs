/** Before/after shots for the ivory side cloister and the graphite license court. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-side-glance" aria-label="Side glance" data-side-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Trade side</p>
        <h2 class="c4-title">Side glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Sides already stored on the orders.</p>
    <ul class="c4-side-rows">
      <li data-side="BUY"><p>EURUSD Ada</p><p class="c4-meta">BUY</p></li>
      <li data-side="SELL"><p>XAUUSD Bea</p><p class="c4-meta">SELL</p></li>
    </ul>
  </section>
  <section class="c4-license-glance" aria-label="License glance" data-license-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Desk licenses</p>
        <h2 class="c4-title">License glance</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Licenses already stored for the desk.</p>
    <ul class="c4-license-rows">
      <li data-kind="active"><p>FCA 123456 Desk</p><p class="c4-meta">Active</p></li>
      <li data-kind="expired"><p>CySEC 9988 Branch</p><p class="c4-meta">Expired</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-side-glance c4-side-cloister" aria-label="Side glance" data-side-glance="1" data-desk="cloister">
    <header class="c4-side-cloister-mast">
      <p class="c4-side-cloister-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-side-cloister-kicker">Ivory side cloister</p>
        <h2 class="c4-title c4-side-cloister-title">Side glance</h2>
        <p class="c4-side-cloister-lead">Trade sides rest in an ivory cloister. Graphite names the row. Champagne marks the side in view.</p>
      </div>
      <p class="c4-side-cloister-count">2</p>
    </header>
    <ol class="c4-side-cloister-index" aria-label="Side glance">
      <li data-tone="gold">Buy</li>
      <li data-tone="ink">Sell</li>
      <li data-tone="ivory">Other</li>
    </ol>
    <p class="c4-meta c4-side-cloister-hint">Sides already stored on the orders.</p>
    <div class="c4-side-cloister-chart" aria-label="Side glance">
      <button type="button" class="c4-side-cloister-column" data-on="1" data-side="buy"><i style="height:88px"></i><strong>2</strong><span>Buy</span></button>
      <button type="button" class="c4-side-cloister-column" data-on="0" data-side="sell"><i style="height:44px"></i><strong>1</strong><span>Sell</span></button>
      <button type="button" class="c4-side-cloister-column" data-on="0" data-side="other"><i style="height:18px"></i><strong>0</strong><span>Other</span></button>
    </div>
    <ul class="c4-side-rows c4-side-cloister-list">
      <li class="c4-side-cloister-card" data-side="BUY" data-on="1"><p>EURUSD Ada</p><p class="c4-meta">BUY</p><button type="button" class="c4-btn">Customer</button></li>
      <li class="c4-side-cloister-card" data-side="SELL"><p>XAUUSD Bea</p><p class="c4-meta">SELL</p></li>
    </ul>
  </section>
  <section class="c4-license-glance c4-license-court" aria-label="License glance" data-license-glance="1" data-desk="court">
    <header class="c4-license-court-mast">
      <p class="c4-license-court-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-license-court-kicker">Graphite license court</p>
        <h2 class="c4-title c4-license-court-title">License glance</h2>
        <p class="c4-license-court-lead">Licenses stand in a graphite court. Ivory holds the row. Champagne marks the kind in view.</p>
      </div>
      <p class="c4-license-court-count">2</p>
    </header>
    <ol class="c4-license-court-index" aria-label="License glance">
      <li data-tone="gold">Live</li>
      <li data-tone="ink">Named</li>
      <li data-tone="ivory">Lapsed</li>
    </ol>
    <p class="c4-meta c4-license-court-hint">Licenses already stored for the desk.</p>
    <div class="c4-license-court-chart" aria-label="License glance">
      <button type="button" class="c4-license-court-column" data-on="1" data-kind="active"><i style="height:88px"></i><strong>1</strong><span>Live</span></button>
      <button type="button" class="c4-license-court-column" data-on="0" data-kind="expired"><i style="height:88px"></i><strong>1</strong><span>Lapsed</span></button>
    </div>
    <ul class="c4-license-rows c4-license-court-list">
      <li class="c4-license-court-card" data-kind="active" data-on="1"><p>FCA 123456 Desk</p><p class="c4-meta">Active</p></li>
      <li class="c4-license-court-card" data-kind="expired"><p>CySEC 9988 Branch</p><p class="c4-meta">Expired</p></li>
    </ul>
  </section>`;

function page(theme, body, mobile) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${body}</div>
        ${mobile ? "" : `<aside class="c4-rail" style="width:92px;min-height:100%;"></aside>`}
      </div>
    </div></body></html>`;
}

const shots = [
  ["crm-round297-cloister-before-light.png", "light", before, false],
  ["crm-round297-cloister-after-light.png", "light", after, false],
  ["crm-round297-cloister-after-dark.png", "dark", after, false],
  ["crm-round297-cloister-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1400 } : { width: 1280, height: 980 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
