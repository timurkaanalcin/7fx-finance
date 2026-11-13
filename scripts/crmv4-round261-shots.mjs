/** Before/after shots for the round 261 stillroom and region plates. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-card" style="margin:18px 20px;padding:16px;">
    <h2 class="c4-title">Stillroom</h2>
    <p class="c4-muted">A plain list of preparation notes, with no shelf, heat, or span.</p>
    <table class="c4-table" style="width:100%;border-collapse:collapse;">
      <thead><tr><th style="text-align:left;">Title</th><th>Keeper</th><th>Note</th></tr></thead>
      <tbody>
        <tr><td>North hearth</td><td>Ada</td><td>Rose, ten minutes</td></tr>
        <tr><td>Shelf rest</td><td>Bea</td><td>Cool and quiet</td></tr>
        <tr><td>Cellar warm</td><td>Noa</td><td>Forty minutes</td></tr>
      </tbody>
    </table>
    <h2 class="c4-title" style="margin-top:24px;">Regions</h2>
    <ul>
      <li>Ada · New York</li>
      <li>Bea · Kent</li>
      <li>Cem · Anatolia</li>
    </ul>
  </section>`;

const after = `
  <section class="c4-srm" data-cards="1" data-desk="stillroom" data-role="desk" data-density="airy">
    <header class="c4-srm-mast">
      <p class="c4-srm-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-srm-kicker">Preparation waiting on a shelf</p>
        <h2 class="c4-title">Stillroom slips</h2>
      </div>
      <ol class="c4-srm-index" aria-label="Stillroom slips">
        <li data-tone="gold">Champagne</li>
        <li data-tone="ink">Graphite</li>
        <li data-tone="ivory">Ivory</li>
      </ol>
    </header>
    <p class="c4-srm-notice" role="status">Overdue on the open desk 1</p>
    <ul class="c4-srm-kpis" aria-label="Counts">
      <li><span>Open</span><strong>3</strong></li>
      <li><span>Held</span><strong>1</strong></li>
      <li><span>Vault</span><strong>0</strong></li>
      <li><span>Peak</span><strong>2</strong></li>
      <li><span>Quiet</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ul>
    <div class="c4-srm-ribbon" aria-label="Shelves">
      <i data-shelf="shelf" style="flex-grow:1"></i>
      <i data-shelf="bench" style="flex-grow:0.4"></i>
      <i data-shelf="hearth" style="flex-grow:2"></i>
      <i data-shelf="cellar" style="flex-grow:1"></i>
    </div>
    <ol class="c4-srm-legend">
      <li data-shelf="shelf"><span>Shelf</span><strong>1</strong></li>
      <li data-shelf="hearth"><span>Hearth</span><strong>2</strong></li>
      <li data-shelf="cellar"><span>Cellar</span><strong>1</strong></li>
    </ol>
    <ol class="c4-srm-board" data-density="airy">
      <li class="c4-srm-card" data-on="1" data-overdue="1" data-peak="1" data-house="1">
        <i class="c4-srm-spine" aria-hidden="true"></i>
        <div>
          <strong>North hearth</strong>
          <p class="c4-srm-meta">Ada · Hearth · Rose · Cool · 10 · Rank 1</p>
          <p class="c4-srm-sla" aria-label="Span"><i style="width:25%"></i></p>
        </div>
      </li>
      <li class="c4-srm-card" data-quiet="1" data-idle="1">
        <i class="c4-srm-spine" aria-hidden="true"></i>
        <div>
          <strong>Shelf rest</strong>
          <p class="c4-srm-meta">Bea · Shelf · Clove · Cool · Rank 1</p>
          <p class="c4-srm-sla" aria-label="Span"><i style="width:50%"></i></p>
        </div>
      </li>
      <li class="c4-srm-card" data-resting="1" data-quiet="1">
        <i class="c4-srm-spine" aria-hidden="true"></i>
        <div>
          <strong>Cellar warm</strong>
          <p class="c4-srm-meta">Noa · Cellar · Honey · Warm · 40</p>
          <p class="c4-srm-sla" aria-label="Span"><i style="width:100%"></i></p>
        </div>
      </li>
    </ol>
    <p class="c4-srm-empty" hidden>No slips on this shelf</p>
  </section>
  <section class="c4-rgp" data-plates="1" data-traders="3" data-role="desk">
    <header class="c4-rgp-mast">
      <p class="c4-rgp-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-rgp-kicker">Region already stored</p>
        <h2 class="c4-title">Region plates</h2>
      </div>
      <ol class="c4-rgp-index">
        <li data-tone="gold">Champagne</li>
        <li data-tone="ink">Graphite</li>
        <li data-tone="ivory">Ivory</li>
      </ol>
    </header>
    <p class="c4-rgp-hint">Plates read the region already stored on the trader. Money fields are not read.</p>
    <ul class="c4-rgp-kpis">
      <li><span>Leading lane</span><strong>Short name</strong></li>
      <li><span>Leading hue</span><strong>Graphite</strong></li>
      <li><span>Spaced name</span><strong>1</strong></li>
      <li><span>Eight letters</span><strong>1</strong></li>
    </ul>
    <div class="c4-rgp-chart" aria-label="Lane counts">
      <button type="button" class="c4-rgp-bar" data-on="1"><span>Short name</span><i style="width:100%"></i><strong>1</strong></button>
      <button type="button" class="c4-rgp-bar"><span>Town</span><i style="width:100%"></i><strong>1</strong></button>
      <button type="button" class="c4-rgp-bar"><span>Two names</span><i style="width:100%"></i><strong>1</strong></button>
    </div>
    <ol class="c4-rgp-board">
      <li class="c4-rgp-card" data-on="1" data-lane="hall" data-hue="graphite"><div><strong>Ada</strong><p class="c4-rgp-meta">NEWY · Two names · Graphite · Letter count 7</p></div></li>
      <li class="c4-rgp-card" data-lane="brief" data-hue="graphite" data-reviewed="1"><div><strong>Bea</strong><p class="c4-rgp-meta">KENT · Short name · Graphite · Letter count 4</p></div></li>
      <li class="c4-rgp-card" data-lane="desk" data-hue="ivory"><div><strong>Cem</strong><p class="c4-rgp-meta">ANAT · Town · Ivory · Letter count 8</p></div></li>
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
  ["crm-round261-stillroom-before-light.png", "light", before, false],
  ["crm-round261-stillroom-after-light.png", "light", after, false],
  ["crm-round261-stillroom-after-dark.png", "dark", after, false],
  ["crm-round261-stillroom-after-mobile.png", "light", after, true],
];

const browser = await chromium.launch({ headless: true });
for (const [name, theme, body, mobile] of shots) {
  const pageObj = await browser.newPage({ viewport: mobile ? { width: 390, height: 1400 } : { width: 1280, height: 1600 } });
  await pageObj.setContent(page(theme, body, mobile), { waitUntil: "load" });
  await pageObj.screenshot({ path: `${out}/${name}`, fullPage: true });
  await pageObj.close();
}
await browser.close();
console.log("shots written", shots.map((row) => row[0]).join(", "));
