/** Before/after shots for the round 273 desk atelier and group folio. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <div class="c4-stack c4-ops-workshop c4-ops-sextant" data-ops="sextant">
    <header class="c4-ops-mast c4-ops-sextant-mast">
      <p class="c4-ops-sextant-seal" data-logo="mono">7FX</p>
      <div class="c4-ops-sextant-copy">
        <p class="c4-ops-sextant-kicker">Sextant</p>
        <h2 class="c4-ops-title">Desks</h2>
        <p class="c4-ops-sextant-lead">Rooms of the house, read through a sextant.</p>
      </div>
    </header>
    <div class="c4-card">
      <h3 class="c4-card-title">Desks</h3>
      <ul class="c4-card-grid">
        <li class="c4-ops-row" data-live="on"><span>North · N1</span><span class="c4-muted">Istanbul active</span></li>
        <li class="c4-ops-row" data-live="off"><span>South · S2</span><span class="c4-muted">Ankara inactive</span></li>
      </ul>
      <form class="c4-form c4-form-2 c4-ops-form">
        <label class="c4-lab"><span>Name</span><input class="c4-field" value="West" /></label>
        <label class="c4-lab"><span>Code</span><input class="c4-field" value="W3" /></label>
        <label class="c4-lab"><span>Office</span><input class="c4-field" value="Izmir" /></label>
        <button type="button" class="c4-btn c4-btn-hot">Create desk</button>
      </form>
    </div>
    <div class="c4-card">
      <h3 class="c4-card-title">Groups</h3>
      <ul>
        <li class="c4-ops-row" data-live="on"><span>Standard book</span><span class="c4-muted">Customers 18</span></li>
        <li class="c4-ops-row" data-live="on"><span>VIP book</span><span class="c4-muted">Customers 4</span></li>
      </ul>
    </div>
  </div>`;

const after = `
  <section class="c4-dsk-atelier" aria-label="Desks">
    <header class="c4-dsk-atelier-mast">
      <p class="c4-dsk-atelier-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-dsk-atelier-kicker">Atelier</p>
        <h3 class="c4-dsk-atelier-title">Desks</h3>
        <p class="c4-dsk-atelier-lead">Desks sit as graphite benches with a champagne rule. A quiet desk keeps its ivory plate.</p>
      </div>
      <ol class="c4-dsk-atelier-index" aria-label="Desks">
        <li data-tone="gold">2</li>
        <li data-tone="ink">Office</li>
        <li data-tone="ivory">Code</li>
      </ol>
    </header>
    <ol class="c4-dsk-atelier-board">
      <li class="c4-dsk-atelier-card" data-live="on"><p class="c4-dsk-atelier-mark">N1</p><div><p class="c4-dsk-atelier-name">North</p><p class="c4-dsk-atelier-meta">N1 · Istanbul · active</p></div><p class="c4-dsk-atelier-count">12</p></li>
      <li class="c4-dsk-atelier-card" data-live="off"><p class="c4-dsk-atelier-mark">S2</p><div><p class="c4-dsk-atelier-name">South</p><p class="c4-dsk-atelier-meta">S2 · Ankara · inactive</p></div><p class="c4-dsk-atelier-count">0</p></li>
    </ol>
    <form class="c4-form c4-form-2 c4-dsk-atelier-form">
      <label class="c4-lab"><span>Name</span><input class="c4-field" value="West" /></label>
      <label class="c4-lab"><span>Code</span><input class="c4-field" value="W3" /></label>
      <label class="c4-lab"><span>Office</span><input class="c4-field" value="Izmir" /></label>
      <button type="button" class="c4-btn c4-btn-hot">Create desk</button>
    </form>
  </section>
  <section class="c4-grp-folio" aria-label="Groups">
    <header class="c4-grp-folio-mast">
      <p class="c4-grp-folio-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-grp-folio-kicker">Folio</p>
        <h3 class="c4-grp-folio-title">Groups</h3>
        <p class="c4-grp-folio-lead">Groups read as ivory folios. The customer count is the large numeral.</p>
      </div>
      <ol class="c4-grp-folio-index">
        <li data-tone="gold">2</li>
        <li data-tone="ink">Name</li>
        <li data-tone="ivory">Customers</li>
      </ol>
    </header>
    <ol class="c4-grp-folio-board">
      <li class="c4-grp-folio-card" data-live="on"><p class="c4-grp-folio-count">18</p><div><p class="c4-grp-folio-name">Standard book</p><p class="c4-grp-folio-meta">Everyday accounts</p></div></li>
      <li class="c4-grp-folio-card" data-live="on"><p class="c4-grp-folio-count">4</p><div><p class="c4-grp-folio-name">VIP book</p><p class="c4-grp-folio-meta">Named follow-up</p></div></li>
    </ol>
  </section>
  <section class="c4-theodolite" data-cards="1" data-desk="theodolite" data-role="desk">
    <header class="c4-theodolite-mast">
      <p class="c4-theodolite-seal" data-logo="mono"><span>7FX</span><i></i></p>
      <div><p class="c4-theodolite-kicker">A survey book kept in this browser</p><h2 class="c4-title">Theodolite circles</h2></div>
      <ol class="c4-theodolite-limbs"><li>Circle</li><li>Vernier</li><li>Clamp limb</li></ol>
    </header>
    <p class="c4-theodolite-notice" role="status">Overdue on the open arc 1</p>
    <ol class="c4-theodolite-ledger">
      <li><span>Field</span><strong>3</strong></li>
      <li><span>Bench</span><strong>0</strong></li>
      <li><span>Cased</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <ol class="c4-theodolite-arc">
      <li data-station="zenith"><strong>1</strong><i style="width:48%"></i><span>Zenith</span></li>
      <li data-station="transit"><strong>0</strong><i style="width:8%"></i><span>Transit</span></li>
      <li data-station="azimuth"><strong>2</strong><i style="width:96%"></i><span>Azimuth</span></li>
      <li data-station="nadir"><strong>0</strong><i style="width:8%"></i><span>Nadir</span></li>
    </ol>
    <ol class="c4-theodolite-board">
      <li class="c4-theodolite-card" data-on="1" data-overdue="1"><div class="c4-theodolite-ring" style="background:conic-gradient(#c6a15b 17%, #efe6d6 17% 100%)"><span>A</span></div><div></div><div><strong>Azimuth sight</strong><p class="c4-theodolite-meta">Nia · Azimuth · Ivory · Circle · 15 · Bead 2</p></div></li>
      <li class="c4-theodolite-card" data-idle="1"><div class="c4-theodolite-ring" style="background:conic-gradient(#c6a15b 0%, #efe6d6 0% 100%)"><span>Z</span></div><div></div><div><strong>Zenith left</strong><p class="c4-theodolite-meta">Sol · Zenith · Graphite · Circle · Bead 2</p></div></li>
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
  ["crm-round273-atelier-before-light.png", "light", before, false],
  ["crm-round273-atelier-after-light.png", "light", after, false],
  ["crm-round273-atelier-after-dark.png", "dark", after, false],
  ["crm-round273-atelier-after-mobile.png", "light", after, true],
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
