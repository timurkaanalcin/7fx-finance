/** Before/after shots for the round 274 marketing gallery and octant arcs. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <div class="c4-stack c4-mkt c4-mkt-folio c4-mkt-salon c4-mkt-mount c4-mkt-brocade" data-desk="brocade">
    <header class="c4-mkt-folio-mast c4-mkt-salon-mast c4-mkt-mount-mast c4-mkt-brocade-mast">
      <p class="c4-mkt-folio-mark c4-mkt-salon-plate c4-mkt-mount-plate c4-mkt-brocade-seal" data-logo="mono">7FX</p>
      <div class="c4-mkt-brocade-copy">
        <p class="c4-mkt-brocade-kicker">Marketing</p>
        <p class="c4-mkt-folio-kicker c4-mkt-salon-kicker c4-mkt-mount-kicker">Campaigns, mail, and partners</p>
        <h2 class="c4-mkt-brocade-title">Campaigns, mail, and partners</h2>
        <h2 class="c4-mkt-salon-title c4-mkt-mount-title">Marketing</h2>
      </div>
      <ol class="c4-mkt-salon-index c4-mkt-mount-index c4-mkt-brocade-index" aria-label="Marketing">
        <li data-tone="gold">Affiliates</li>
        <li data-tone="ink">Templates</li>
        <li data-tone="mist">Leads</li>
      </ol>
    </header>
    <ol class="c4-mkt-brocade-stats" aria-label="Counts">
      <li><span>Affiliates</span><strong>2</strong></li>
      <li><span>Leads</span><strong>22</strong></li>
      <li><span>Valid</span><strong>73%</strong></li>
    </ol>
    <div class="c4-card">
      <h3 class="c4-card-title">Affiliates</h3>
      <ul>
        <li class="c4-mkt-salon-row c4-mkt-mount-row c4-mkt-brocade-row" data-tone="bright"><span>North desk</span><span class="c4-muted">Leads 18</span></li>
        <li class="c4-mkt-salon-row c4-mkt-mount-row c4-mkt-brocade-row" data-tone="dim"><span>South desk</span><span class="c4-muted">Leads 4</span></li>
      </ul>
    </div>
  </div>`;

const after = `
  <div class="c4-stack c4-mkt-gallery" data-desk="gallery">
    <header class="c4-mkt-gallery-mast">
      <p class="c4-mkt-gallery-seal" data-logo="mono">7FX</p>
      <div class="c4-mkt-gallery-copy">
        <p class="c4-mkt-gallery-kicker">Gallery</p>
        <h2 class="c4-mkt-gallery-title">Marketing</h2>
        <p class="c4-mkt-gallery-lead">Campaigns sit in an ivory gallery with a champagne rail. The lead count is the large numeral.</p>
      </div>
      <ol class="c4-mkt-gallery-index" aria-label="Marketing">
        <li data-tone="gold">2</li>
        <li data-tone="ink">Mail</li>
        <li data-tone="ivory">73%</li>
      </ol>
    </header>
    <ol class="c4-mkt-gallery-stats" aria-label="Counts">
      <li><span>Affiliates</span><strong>2</strong></li>
      <li><span>Leads</span><strong>22</strong></li>
      <li><span>Valid</span><strong>73%</strong></li>
    </ol>
    <ol>
      <li class="c4-mkt-gallery-slip" data-tone="bright"><strong>North desk</strong><p class="c4-mkt-gallery-lead">Leads 18 · valid ahead</p></li>
      <li class="c4-mkt-gallery-slip" data-tone="dim"><strong>South desk</strong><p class="c4-mkt-gallery-lead">Leads 4 · quiet book</p></li>
    </ol>
  </div>
  <section class="c4-octant" data-cards="1" data-desk="octant" data-role="desk">
    <header class="c4-octant-mast">
      <p class="c4-octant-seal" data-logo="mono"><span>7FX</span><i></i></p>
      <div><p class="c4-octant-kicker">A coastal sight book kept in this browser</p><h2 class="c4-title">Octant arcs</h2></div>
      <ol class="c4-octant-limbs"><li>Index</li><li>Horizon</li><li>Shade mirror</li></ol>
    </header>
    <p class="c4-octant-notice" role="status">Overdue on the open altitude 1</p>
    <ol class="c4-octant-ledger">
      <li><span>Deck</span><strong>3</strong></li>
      <li><span>Locker</span><strong>0</strong></li>
      <li><span>Chest</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <ol class="c4-octant-sightbar">
      <li data-sight="harbor"><strong>1</strong><i style="width:48%"></i><span>Harbor</span></li>
      <li data-sight="headland"><strong>0</strong><i style="width:8%"></i><span>Headland</span></li>
      <li data-sight="reef"><strong>2</strong><i style="width:96%"></i><span>Reef</span></li>
      <li data-sight="offing"><strong>0</strong><i style="width:8%"></i><span>Offing</span></li>
    </ol>
    <ol class="c4-octant-board">
      <li class="c4-octant-card" data-on="1" data-overdue="1"><div class="c4-octant-ring" style="background:conic-gradient(#c6a15b 17%, #efe6d6 17% 100%)"><span>R</span></div><div></div><div><strong>Reef sight</strong><p class="c4-octant-meta">Nia · Reef · Ivory · Index · 10 · Shade 1</p></div></li>
      <li class="c4-octant-card" data-idle="1"><div class="c4-octant-ring" style="background:conic-gradient(#c6a15b 0%, #efe6d6 0% 100%)"><span>H</span></div><div></div><div><strong>Harbor left</strong><p class="c4-octant-meta">Sol · Harbor · Graphite · Index · Shade 1</p></div></li>
    </ol>
  </section>`;

function page(theme, body, mobile) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
      <div style="display:${mobile ? "block" : "grid"};grid-template-columns:minmax(0,1fr) 92px;align-items:start;">
        <div>${body}</div>
        ${mobile ? "" : `<aside class="c4-rail" style="width:92px;min-height:780px;"></aside>`}
      </div>
    </div></body></html>`;
}

const shots = [
  ["crm-round274-gallery-before-light.png", "light", before, false],
  ["crm-round274-gallery-after-light.png", "light", after, false],
  ["crm-round274-gallery-after-dark.png", "dark", after, false],
  ["crm-round274-gallery-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1800 } : { width: 1280, height: 2200 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
