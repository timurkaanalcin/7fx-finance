/** Before/after shots for the graphite banner court and the ivory type cabinet. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-status-banner" aria-label="Status banner" data-status-banner="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Desk line</p>
        <h2 class="c4-title">Status banner</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short line the desk can pin or hide. It stays in this browser.</p>
    <ul class="c4-banner-list">
      <li class="c4-banner-card" data-pinned="1"><p>Desk is quiet until noon</p><div class="c4-row"><button type="button" class="c4-btn">Unpin</button><button type="button" class="c4-btn">Hide</button></div></li>
      <li class="c4-banner-card" data-pinned="0"><p>Callback window is open</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Hide</button></div></li>
    </ul>
  </section>
  <section class="c4-type-glance" aria-label="Document types" data-type-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Files by type</p>
        <h2 class="c4-title">Document types</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Types already stored on the documents. Money fields are not read.</p>
    <ul class="c4-type-rows">
      <li data-type="ID"><p>Amina</p><p class="c4-meta">ID</p><button type="button" class="c4-btn">Customer</button></li>
      <li data-type="blank"><p>Nia</p><p class="c4-meta">Blank</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-status-banner c4-banner-court" aria-label="Status banner" data-status-banner="1" data-desk="court">
    <header class="c4-banner-court-mast">
      <p class="c4-banner-court-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-banner-court-kicker">Graphite banner court</p>
        <h2 class="c4-title c4-banner-court-title">Status banner</h2>
        <p class="c4-banner-court-lead">Status lines rest on ivory. Graphite names the card. Champagne marks what is pinned.</p>
      </div>
      <p class="c4-banner-court-count">2</p>
    </header>
    <ol class="c4-banner-court-index" aria-label="Status banner">
      <li data-tone="gold">Pinned</li>
      <li data-tone="ink">Open</li>
      <li data-tone="ivory">Hidden</li>
    </ol>
    <p class="c4-banner-court-hint">A short line the desk can pin or hide. It stays in this browser.</p>
    <ul class="c4-banner-list c4-banner-court-list">
      <li class="c4-banner-card c4-banner-court-card" data-pinned="1"><p>Desk is quiet until noon</p><div class="c4-row"><button type="button" class="c4-btn">Unpin</button><button type="button" class="c4-btn">Hide</button></div></li>
      <li class="c4-banner-card c4-banner-court-card" data-pinned="0"><p>Callback window is open</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Hide</button></div></li>
    </ul>
  </section>
  <section class="c4-type-glance c4-type-cabinet" aria-label="Document types" data-type-glance="1" data-desk="cabinet">
    <header class="c4-type-cabinet-mast">
      <p class="c4-type-cabinet-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-type-cabinet-kicker">Ivory type cabinet</p>
        <h2 class="c4-title c4-type-cabinet-title">Document types</h2>
        <p class="c4-type-cabinet-lead">Document types sit in an ivory cabinet. Graphite names the file. Champagne marks the type in view.</p>
      </div>
      <p class="c4-type-cabinet-count">2</p>
    </header>
    <ol class="c4-type-cabinet-index" aria-label="Document types">
      <li data-tone="gold">Chosen</li>
      <li data-tone="ink">Named</li>
      <li data-tone="ivory">Hidden</li>
    </ol>
    <p class="c4-type-cabinet-hint">Types already stored on the documents. Money fields are not read.</p>
    <ul class="c4-type-rows c4-type-cabinet-list">
      <li class="c4-type-cabinet-card" data-type="ID" data-on="1"><p>Amina</p><p class="c4-meta">ID</p><button type="button" class="c4-btn">Customer</button></li>
      <li class="c4-type-cabinet-card" data-type="blank"><p>Nia</p><p class="c4-meta">Blank</p></li>
    </ul>
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
  ["crm-round294-court-before-light.png", "light", before, false],
  ["crm-round294-court-after-light.png", "light", after, false],
  ["crm-round294-court-after-dark.png", "dark", after, false],
  ["crm-round294-court-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1600 } : { width: 1280, height: 1400 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
