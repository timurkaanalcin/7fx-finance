/** Before/after shots for the round 286 lamp court. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-shortcut-rail c4-shortcut-gallery" aria-label="Shortcuts">
    <header class="c4-shortcut-mast">
      <p class="c4-shortcut-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Personal routes</p>
        <h2 class="c4-title">Shortcuts</h2>
      </div>
      <p class="c4-shortcut-count">3</p>
    </header>
    <p class="c4-meta">Routes kept in this browser.</p>
    <ol class="c4-shortcut-list">
      <li><a href="#customers">Accounts</a><div class="c4-row"><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></div></li>
      <li><a href="#cases">Document review</a><div class="c4-row"><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></div></li>
      <li><a href="#kyc">KYC</a><div class="c4-row"><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></div></li>
    </ol>
  </section>
  <section class="c4-case-queue c4-case-gallery" aria-label="Document review">
    <header class="c4-case-mast">
      <p class="c4-case-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Files waiting</p>
        <h2 class="c4-title">Document review</h2>
      </div>
      <p class="c4-case-count">2</p>
    </header>
    <ul class="c4-case-cards">
      <li class="c4-case-card c4-case-docket" data-status="PENDING">
        <div class="c4-row c4-between"><strong>Passport — Amina</strong><span class="c4-case-status" data-status="PENDING">Pending</span></div>
        <p class="c4-meta">Passport · North desk</p>
        <label class="c4-lab"><span>Reason</span><input class="c4-field" aria-label="Reason" aria-required="false" placeholder="Optional" /></label>
      </li>
      <li class="c4-case-card c4-case-docket" data-status="APPROVED">
        <div class="c4-row c4-between"><strong>Proof of address — Nia</strong><span class="c4-case-status" data-status="APPROVED">Approved</span></div>
        <p class="c4-meta">Address · East desk</p>
      </li>
    </ul>
  </section>`;

const after = `
  <section class="c4-shortcut-rail c4-shortcut-gallery c4-shortcut-lamp" data-lamp="1" aria-label="Shortcuts">
    <header class="c4-shortcut-lamp-mast">
      <p class="c4-shortcut-lamp-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-shortcut-lamp-kicker">Lamp court</p>
        <h2 class="c4-title c4-shortcut-lamp-title">Shortcuts</h2>
        <p class="c4-shortcut-lamp-lead">Shortcuts sit on ivory plates. Graphite holds the count. Champagne marks the route in use.</p>
      </div>
      <p class="c4-shortcut-lamp-count">3</p>
    </header>
    <ol class="c4-shortcut-lamp-index" aria-label="Shortcuts">
      <li data-tone="gold">Routes</li>
      <li data-tone="ink">Order</li>
      <li data-tone="ivory">Hidden</li>
    </ol>
    <p class="c4-meta">Routes kept in this browser.</p>
    <ol class="c4-shortcut-lamp-list">
      <li class="c4-shortcut-lamp-row"><span class="c4-shortcut-lamp-orb"></span><a href="#customers">Accounts</a><div class="c4-row"><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></div></li>
      <li class="c4-shortcut-lamp-row"><span class="c4-shortcut-lamp-orb"></span><a href="#cases">Document review</a><div class="c4-row"><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></div></li>
      <li class="c4-shortcut-lamp-row"><span class="c4-shortcut-lamp-orb"></span><a href="#kyc">KYC</a><div class="c4-row"><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></div></li>
    </ol>
  </section>
  <section class="c4-case-queue c4-case-gallery c4-case-lamp" data-lamp="1" aria-label="Document review">
    <header class="c4-case-lamp-mast">
      <p class="c4-case-lamp-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-case-lamp-kicker">Case lamp</p>
        <h2 class="c4-title c4-case-lamp-title">Document review</h2>
        <p class="c4-case-lamp-lead">Document review sits on ivory plates. The reason stays optional.</p>
      </div>
      <p class="c4-case-lamp-count">2</p>
    </header>
    <ol class="c4-case-lamp-index" aria-label="Document review">
      <li data-tone="gold">Queue</li>
      <li data-tone="ink">Open file</li>
      <li data-tone="ivory">Pin</li>
    </ol>
    <ul class="c4-case-cards">
      <li class="c4-case-card c4-case-docket c4-case-lamp-card" data-status="PENDING">
        <div class="c4-row c4-between"><strong>Passport — Amina</strong><span class="c4-case-status" data-status="PENDING">Pending</span></div>
        <p class="c4-meta">Passport · North desk</p>
        <label class="c4-lab"><span>Reason</span><input class="c4-field" aria-label="Reason" aria-required="false" placeholder="Optional" /></label>
      </li>
      <li class="c4-case-card c4-case-docket c4-case-lamp-card" data-status="APPROVED">
        <div class="c4-row c4-between"><strong>Proof of address — Nia</strong><span class="c4-case-status" data-status="APPROVED">Approved</span></div>
        <p class="c4-meta">Address · East desk</p>
      </li>
    </ul>
  </section>
  <section class="c4-waywiser" data-cards="1" data-desk="yard" data-role="desk" data-density="air">
    <header class="c4-waywiser-mast">
      <p class="c4-waywiser-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-waywiser-kicker">A measuring book kept in this browser</p>
        <h2 class="c4-title">Waywiser wheels</h2>
      </div>
    </header>
    <ol class="c4-waywiser-index"><li data-tone="gold">Gilt</li><li data-tone="ink">Iron</li><li data-tone="ivory">Oak</li></ol>
    <p class="c4-waywiser-notice" role="status">Overdue 1</p>
    <ol class="c4-waywiser-dials">
      <li><span>Yard</span><strong>2</strong></li>
      <li><span>Shed</span><strong>0</strong></li>
      <li><span>Loft</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <div class="c4-waywiser-chart">
      <div class="c4-waywiser-column" data-road="lane"><i style="height:40%"></i><strong>0</strong><span>Lane</span></div>
      <div class="c4-waywiser-column" data-road="court"><i style="height:18%"></i><strong>0</strong><span>Court</span></div>
      <div class="c4-waywiser-column" data-on="1" data-road="quay"><i style="height:88%"></i><strong>1</strong><span>Quay</span></div>
      <div class="c4-waywiser-column" data-road="park"><i style="height:56%"></i><strong>1</strong><span>Park</span></div>
    </div>
    <ol class="c4-waywiser-board">
      <li class="c4-waywiser-card" data-on="1" data-overdue="1"><div><strong>Quay watch</strong><p class="c4-waywiser-meta">Nia · Quay · Iron · 4 · Turn 1</p></div></li>
      <li class="c4-waywiser-card" data-brisk="1"><div><strong>Park gilt</strong><p class="c4-waywiser-meta">Sol · Park · Gilt · 8 · Turn 3</p></div></li>
    </ol>
  </section>
  <section class="c4-hourplate" data-plates="1" data-names="3">
    <header class="c4-hourplate-mast">
      <p class="c4-hourplate-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-hourplate-kicker">Last seen time already on the account</p>
        <h2 class="c4-title">Hour plates</h2>
      </div>
    </header>
    <ol class="c4-hourplate-index"><li data-tone="gold">Live</li><li data-tone="ink">Stale</li><li data-tone="ivory">Noon</li></ol>
    <ul class="c4-hourplate-kpis">
      <li><span>Live</span><strong>1</strong></li>
      <li><span>Stale</span><strong>1</strong></li>
      <li><span>Today</span><strong>2</strong></li>
      <li><span>Quiet</span><strong>1</strong></li>
    </ul>
    <div class="c4-hourplate-chart">
      <div class="c4-hourplate-column" data-on="1" data-lane="live"><i style="height:80%"></i><strong>1</strong><span>Live</span></div>
      <div class="c4-hourplate-column" data-lane="stale"><i style="height:48%"></i><strong>1</strong><span>Stale</span></div>
      <div class="c4-hourplate-column" data-lane="dawn"><i style="height:20%"></i><strong>0</strong><span>Dawn</span></div>
      <div class="c4-hourplate-column" data-lane="noon"><i style="height:36%"></i><strong>0</strong><span>Noon</span></div>
      <div class="c4-hourplate-column" data-lane="dusk"><i style="height:20%"></i><strong>0</strong><span>Dusk</span></div>
      <div class="c4-hourplate-column" data-lane="night"><i style="height:20%"></i><strong>0</strong><span>Night</span></div>
    </div>
    <ol class="c4-hourplate-board">
      <li class="c4-hourplate-card" data-live="1" data-lane="live"><p class="c4-hourplate-stamp">11:50</p><div><strong>Amina</strong><p class="c4-hourplate-meta">Live · Champagne · Hour 11</p></div></li>
      <li class="c4-hourplate-card" data-stale="1" data-lane="stale"><p class="c4-hourplate-stamp">09:10</p><div><strong>Nia</strong><p class="c4-hourplate-meta">Stale · Graphite · Hour 9</p></div></li>
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
  ["crm-round286-lamp-before-light.png", "light", before, false],
  ["crm-round286-lamp-after-light.png", "light", after, false],
  ["crm-round286-lamp-after-dark.png", "dark", after, false],
  ["crm-round286-lamp-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1800 } : { width: 1280, height: 1600 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
