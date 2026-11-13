/** Before/after shots for the round 264 pastry press on history and reports, plus the new desks. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-history-desk c4-history-folio" data-history="1">
    <header class="c4-pay-head c4-folio-mast">
      <div>
        <p class="c4-pay-kicker c4-folio-kicker">Loaded lines</p>
        <h2 class="c4-title c4-folio-title">History</h2>
      </div>
      <p class="c4-folio-plate" data-logo="mono">7FX</p>
    </header>
    <p class="c4-meta">A day groups the loaded lines.</p>
    <p class="c4-meta">Showing 3</p>
    <div class="c4-pay-kpis">
      <article class="c4-pay-kpi"><span class="c4-meta">Money · USD</span><strong>1,240</strong><span class="c4-meta">4</span></article>
      <article class="c4-pay-kpi"><span class="c4-meta">Money · EUR</span><strong>860</strong><span class="c4-meta">2</span></article>
    </div>
    <div class="c4-row">
      <button type="button" class="c4-chip" data-on="1">All</button>
      <button type="button" class="c4-chip">info</button>
      <button type="button" class="c4-chip">warn</button>
    </div>
    <ol class="c4-history-list">
      <li class="c4-history-line" data-level="info"><strong>Ada</strong> approved a note</li>
      <li class="c4-history-line" data-level="warn"><strong>Bea</strong> opened a ticket</li>
      <li class="c4-history-line" data-level="info"><strong>Cem</strong> saved a view</li>
    </ol>
  </section>
  <section class="c4-report-center c4-report-luxe c4-report-salon" data-reports="1" data-period="week">
    <header class="c4-report-salon-mast">
      <div>
        <p class="c4-report-salon-kicker">This window against the one before it</p>
        <h2 class="c4-title c4-report-salon-title">Reports</h2>
      </div>
      <p class="c4-report-salon-plate" data-logo="mono">7FX</p>
    </header>
    <div class="c4-report-salon-tools c4-row">
      <button type="button" class="c4-chip" data-on="1">Week</button>
      <button type="button" class="c4-chip">Month</button>
      <button type="button" class="c4-btn">Print</button>
    </div>
    <article class="c4-report-card c4-report-salon-card">
      <h3 class="c4-title">Registrations</h3>
      <p class="c4-meta">12 now · 9 before</p>
      <table class="c4-report-table"><tbody><tr><td>Ada</td><td>Desk</td></tr><tr><td>Bea</td><td>Desk</td></tr></tbody></table>
    </article>
  </section>`;

const after = `
  <section class="c4-history-desk c4-history-folio c4-history-pastry" data-history="1" data-desk="pastry">
    <header class="c4-pay-head c4-folio-mast c4-history-pastry-mast">
      <div>
        <p class="c4-pay-kicker c4-folio-kicker">Loaded lines</p>
        <h2 class="c4-title c4-folio-title">History</h2>
      </div>
      <p class="c4-folio-plate" data-logo="mono">7FX</p>
    </header>
    <p class="c4-history-pastry-lead">The history desk wears a pastry ticket: graphite rail, ivory sheet, champagne stitch.</p>
    <ol class="c4-history-pastry-index">
      <li data-tone="gold">All</li>
      <li data-tone="ink">Money</li>
      <li data-tone="ivory">Jump</li>
    </ol>
    <p class="c4-meta">A day groups the loaded lines.</p>
    <div class="c4-pay-kpis">
      <article class="c4-pay-kpi"><span class="c4-meta">Money · USD</span><strong>1,240</strong><span class="c4-meta">4</span></article>
      <article class="c4-pay-kpi"><span class="c4-meta">Money · EUR</span><strong>860</strong><span class="c4-meta">2</span></article>
    </div>
    <div class="c4-row">
      <button type="button" class="c4-chip" data-on="1">All</button>
      <button type="button" class="c4-chip">info</button>
      <button type="button" class="c4-chip">warn</button>
    </div>
    <ol class="c4-history-list">
      <li class="c4-history-line" data-level="info"><strong>Ada</strong> approved a note</li>
      <li class="c4-history-line" data-level="warn"><strong>Bea</strong> opened a ticket</li>
      <li class="c4-history-line" data-level="info"><strong>Cem</strong> saved a view</li>
    </ol>
  </section>
  <section class="c4-report-center c4-report-luxe c4-report-salon c4-report-pastry" data-reports="1" data-period="week" data-desk="pastry">
    <header class="c4-report-salon-mast c4-report-pastry-mast">
      <div>
        <p class="c4-report-salon-kicker">This window against the one before it</p>
        <h2 class="c4-title c4-report-salon-title">Reports</h2>
      </div>
      <p class="c4-report-salon-plate" data-logo="mono">7FX</p>
    </header>
    <p class="c4-report-pastry-lead">Reports sit on the same pastry press, with the week and the month as facing tickets.</p>
    <ol class="c4-report-pastry-index">
      <li data-tone="gold">Week</li>
      <li data-tone="ink">Month</li>
      <li data-tone="ivory">Print</li>
    </ol>
    <div class="c4-report-salon-tools c4-row">
      <button type="button" class="c4-chip" data-on="1">Week</button>
      <button type="button" class="c4-chip">Month</button>
      <button type="button" class="c4-btn">Print</button>
    </div>
    <article class="c4-report-card c4-report-salon-card">
      <h3 class="c4-title">Registrations</h3>
      <p class="c4-meta">12 now · 9 before</p>
      <table class="c4-report-table"><tbody><tr><td>Ada</td><td>Desk</td></tr><tr><td>Bea</td><td>Desk</td></tr></tbody></table>
    </article>
  </section>
  <section class="c4-pastry" data-cards="1" data-desk="pastry" data-role="desk" data-density="roomy">
    <header class="c4-pastry-mast">
      <p class="c4-pastry-seal" data-logo="mono">7FX</p>
      <div class="c4-pastry-mast-copy">
        <p class="c4-pastry-kicker">A pastry follow-up on the desk</p>
        <h2 class="c4-title">Pastry slips</h2>
      </div>
    </header>
    <p class="c4-pastry-notice" role="status">Overdue on the open bench 1</p>
    <ol class="c4-pastry-ledger">
      <li><span>Open</span><strong>3</strong></li>
      <li><span>Pause</span><strong>0</strong></li>
      <li><span>Sealed</span><strong>0</strong></li>
      <li><span>Pinned</span><strong>1</strong></li>
      <li><span>Peak</span><strong>1</strong></li>
      <li><span>Quiet</span><strong>2</strong></li>
      <li><span>Soon</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <ol class="c4-pastry-board">
      <li class="c4-pastry-label" data-on="1" data-overdue="1" data-peak="1" data-house="1">
        <div class="c4-pastry-monogram">N</div>
        <div></div>
        <div><strong>North slab</strong><p class="c4-pastry-meta">Ada · Slab · Sugar · Fold · 15 · Rank 1</p></div>
      </li>
      <li class="c4-pastry-label" data-quiet="1" data-idle="1">
        <div class="c4-pastry-monogram">P</div>
        <div></div>
        <div><strong>Peel rest</strong><p class="c4-pastry-meta">Bea · Peel · Butter · Fold · Rank 1</p></div>
      </li>
    </ol>
  </section>
  <section class="c4-cipher" data-plates="1" data-traders="3" data-role="desk">
    <header class="c4-cipher-mast">
      <p class="c4-cipher-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-cipher-kicker">Partner C code already stored</p>
        <h2 class="c4-title">Cipher plates</h2>
      </div>
    </header>
    <ol class="c4-cipher-index">
      <li data-tone="gold">Champagne</li>
      <li data-tone="ink">Graphite</li>
      <li data-tone="ivory">Ivory</li>
    </ol>
    <ul class="c4-cipher-kpis">
      <li><span>Leading lane</span><strong>Crest</strong></li>
      <li><span>Leading hue</span><strong>Champagne</strong></li>
      <li><span>Known code</span><strong>2</strong></li>
      <li><span>Crest share</span><strong>33%</strong></li>
    </ul>
    <ol class="c4-cipher-board">
      <li class="c4-cipher-card" data-lane="crest" data-hue="champagne"><p class="c4-cipher-stamp">CRES</p><div></div><div><strong>Ada</strong><p class="c4-cipher-meta">Crest · Champagne · Letter count 5</p></div></li>
      <li class="c4-cipher-card" data-lane="board" data-hue="graphite"><p class="c4-cipher-stamp">CODE</p><div></div><div><strong>Bea</strong><p class="c4-cipher-meta">Board · Graphite · Letter count 4</p></div></li>
      <li class="c4-cipher-card" data-lane="mark" data-hue="ivory"><p class="c4-cipher-stamp">STAF</p><div></div><div><strong>Cem</strong><p class="c4-cipher-meta">Plain word · Ivory · Letter count 5</p></div></li>
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
  ["crm-round264-pastry-before-light.png", "light", before, false],
  ["crm-round264-pastry-after-light.png", "light", after, false],
  ["crm-round264-pastry-after-dark.png", "dark", after, false],
  ["crm-round264-pastry-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1600 } : { width: 1280, height: 1800 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
