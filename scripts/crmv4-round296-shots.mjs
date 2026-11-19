/** Before/after shots for the ivory pad gallery and the graphite order colonnade. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-scratch-pads" aria-label="Scratch pads" data-scratch-pads="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Desk notes</p>
        <h2 class="c4-title">Scratch pads</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Notes the desk keeps in this browser.</p>
    <ul class="c4-pad-list">
      <li class="c4-pad-card" data-pinned="1"><p>Call Amina before noon</p><div class="c4-row"><button type="button" class="c4-btn">Unpin</button><button type="button" class="c4-btn">Hide</button></div></li>
      <li class="c4-pad-card" data-pinned="0"><p>Check the callback sheet</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Hide</button></div></li>
    </ul>
  </section>
  <section class="c4-order-glance" aria-label="Order status" data-order-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Orders by state</p>
        <h2 class="c4-title">Order status</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">States already stored on the orders.</p>
    <ul class="c4-order-rows">
      <li data-status="Open"><p>EURUSD Amina</p><p class="c4-meta">Open</p><button type="button" class="c4-btn">Customer</button></li>
      <li data-status="blank"><p>XAUUSD Nia</p><p class="c4-meta">Blank</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-scratch-pads c4-pad-gallery" aria-label="Scratch pads" data-scratch-pads="1" data-desk="gallery">
    <header class="c4-pad-gallery-mast">
      <p class="c4-pad-gallery-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pad-gallery-kicker">Ivory pad gallery</p>
        <h2 class="c4-title c4-pad-gallery-title">Scratch pads</h2>
        <p class="c4-pad-gallery-lead">Notes rest in an ivory gallery. Graphite names the card. Champagne marks what is pinned.</p>
      </div>
      <p class="c4-pad-gallery-count">2</p>
    </header>
    <ol class="c4-pad-gallery-index" aria-label="Scratch pads">
      <li data-tone="gold">Pinned</li>
      <li data-tone="ink">Open</li>
      <li data-tone="ivory">Hidden</li>
    </ol>
    <p class="c4-pad-gallery-hint">Notes the desk keeps in this browser.</p>
    <ul class="c4-pad-list c4-pad-gallery-list">
      <li class="c4-pad-card c4-pad-gallery-card" data-pinned="1"><p>Call Amina before noon</p><div class="c4-row"><button type="button" class="c4-btn">Unpin</button><button type="button" class="c4-btn">Hide</button></div></li>
      <li class="c4-pad-card c4-pad-gallery-card" data-pinned="0"><p>Check the callback sheet</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Hide</button></div></li>
    </ul>
  </section>
  <section class="c4-order-glance c4-order-colonnade" aria-label="Order status" data-order-glance="1" data-desk="colonnade">
    <header class="c4-order-colonnade-mast">
      <p class="c4-order-colonnade-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-order-colonnade-kicker">Graphite order colonnade</p>
        <h2 class="c4-title c4-order-colonnade-title">Order status</h2>
        <p class="c4-order-colonnade-lead">Order states stand in a graphite colonnade. Ivory holds the row. Champagne marks the state in view.</p>
      </div>
      <p class="c4-order-colonnade-count">2</p>
    </header>
    <ol class="c4-order-colonnade-index" aria-label="Order status">
      <li data-tone="gold">Chosen</li>
      <li data-tone="ink">Named</li>
      <li data-tone="ivory">Blank</li>
    </ol>
    <p class="c4-order-colonnade-hint">States already stored on the orders.</p>
    <div class="c4-order-colonnade-chart" aria-label="Order status">
      <button type="button" class="c4-order-colonnade-column" data-on="1" data-status="Open"><i style="height:88px"></i><strong>2</strong><span>Open</span></button>
      <button type="button" class="c4-order-colonnade-column" data-on="0" data-status="blank"><i style="height:44px"></i><strong>1</strong><span>Blank</span></button>
    </div>
    <ul class="c4-order-rows c4-order-colonnade-list">
      <li class="c4-order-colonnade-card" data-status="Open" data-on="1"><p>EURUSD Amina</p><p class="c4-meta">Open</p><button type="button" class="c4-btn">Customer</button></li>
      <li class="c4-order-colonnade-card" data-status="blank"><p>XAUUSD Nia</p><p class="c4-meta">Blank</p></li>
    </ul>
  </section>`;

function page(theme, body, mobile) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${body}</div>
        ${mobile ? "" : `<aside class="c4-rail" style="width:92px;min-height:980px;"></aside>`}
      </div>
    </div></body></html>`;
}

const shots = [
  ["crm-round296-gallery-before-light.png", "light", before, false],
  ["crm-round296-gallery-after-light.png", "light", after, false],
  ["crm-round296-gallery-after-dark.png", "dark", after, false],
  ["crm-round296-gallery-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1800 } : { width: 1280, height: 1700 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
