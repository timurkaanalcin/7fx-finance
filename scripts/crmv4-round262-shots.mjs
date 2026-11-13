/** Before/after shots for the round 262 larder slips and title plates. */
import fs from "node:fs";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-card" style="margin:18px 20px;padding:16px;">
    <h2 class="c4-title">Larder</h2>
    <p class="c4-muted">A plain list of pantry notes, with no station, pace, or wait.</p>
    <table class="c4-table" style="width:100%;border-collapse:collapse;">
      <thead><tr><th style="text-align:left;">Title</th><th>Keeper</th><th>Note</th></tr></thead>
      <tbody>
        <tr><td>North crock</td><td>Ada</td><td>Oat, twelve minutes</td></tr>
        <tr><td>Bin rest</td><td>Bea</td><td>Slow and quiet</td></tr>
        <tr><td>Loft even</td><td>Noa</td><td>Thirty-six minutes</td></tr>
      </tbody>
    </table>
    <h2 class="c4-title" style="margin-top:24px;">Titles</h2>
    <ul>
      <li>Ada · analyst</li>
      <li>Bea · administrator</li>
      <li>Cem · sales_manager</li>
    </ul>
  </section>`;

const after = `
  <section class="c4-lrd" data-cards="1" data-desk="larder" data-role="desk" data-density="roomy">
    <header class="c4-lrd-mast">
      <div class="c4-lrd-mast-copy">
        <p class="c4-lrd-kicker">A pantry follow-up on the desk</p>
        <h2 class="c4-title">Larder slips</h2>
      </div>
      <i class="c4-lrd-rule" aria-hidden="true"></i>
      <p class="c4-lrd-seal" data-logo="mono">7FX</p>
    </header>
    <p class="c4-lrd-notice" role="status">Overdue on the open desk 1</p>
    <ol class="c4-lrd-ledger" aria-label="Counts">
      <li><span>Open</span><strong>3</strong></li>
      <li><span>Pause</span><strong>1</strong></li>
      <li><span>Sealed</span><strong>0</strong></li>
      <li><span>Pinned</span><strong>1</strong></li>
      <li><span>Peak</span><strong>1</strong></li>
      <li><span>Quiet</span><strong>2</strong></li>
      <li><span>Soon</span><strong>1</strong></li>
      <li><span>Overdue</span><strong>1</strong></li>
    </ol>
    <ol class="c4-lrd-bars" aria-label="Stations">
      <li data-station="bin"><span>Bin</span><i style="width:40%"></i><strong>1</strong></li>
      <li data-station="crock"><span>Crock</span><i style="width:70%"></i><strong>1</strong></li>
      <li data-station="rack"><span>Rack</span><i style="width:8%"></i><strong>0</strong></li>
      <li data-station="loft"><span>Loft</span><i style="width:100%"></i><strong>1</strong></li>
    </ol>
    <ol class="c4-lrd-board" data-density="roomy">
      <li class="c4-lrd-jar" data-on="1" data-overdue="1" data-peak="1" data-house="1">
        <div class="c4-lrd-monogram" aria-hidden="true">N</div>
        <div>
          <strong>North crock</strong>
          <p class="c4-lrd-meta">Ada · Crock · Oat · Slow · 12 · Rank 2</p>
          <p class="c4-lrd-dial" aria-label="Wait" style="background:conic-gradient(#c6a15b 33%, #efe6d6 33% 100%)"></p>
        </div>
      </li>
      <li class="c4-lrd-jar" data-quiet="1" data-idle="1">
        <div class="c4-lrd-monogram" aria-hidden="true">B</div>
        <div>
          <strong>Bin rest</strong>
          <p class="c4-lrd-meta">Bea · Bin · Rye · Slow · Rank 2</p>
          <p class="c4-lrd-dial" aria-label="Wait" style="background:conic-gradient(#c6a15b 0%, #efe6d6 0% 100%)"></p>
        </div>
      </li>
      <li class="c4-lrd-jar" data-resting="1" data-quiet="1">
        <div class="c4-lrd-monogram" aria-hidden="true">L</div>
        <div>
          <strong>Loft even</strong>
          <p class="c4-lrd-meta">Noa · Loft · Wheat · Even · 36</p>
          <p class="c4-lrd-dial" aria-label="Wait" style="background:conic-gradient(#c6a15b 100%, #efe6d6 100% 100%)"></p>
        </div>
      </li>
    </ol>
    <p class="c4-lrd-empty" hidden>No slips on this station</p>
  </section>
  <section class="c4-ttl" data-plates="1" data-traders="3" data-role="desk">
    <header class="c4-ttl-mast">
      <p class="c4-ttl-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-ttl-kicker">Job title already stored</p>
        <h2 class="c4-title">Title plates</h2>
      </div>
    </header>
    <ol class="c4-ttl-index">
      <li data-tone="gold">Champagne</li>
      <li data-tone="ink">Graphite</li>
      <li data-tone="ivory">Ivory</li>
    </ol>
    <p class="c4-ttl-hint">Plates read the job title already stored on the trader. Money fields are not read.</p>
    <ul class="c4-ttl-kpis">
      <li><span>Leading lane</span><strong>Short word</strong></li>
      <li><span>Leading hue</span><strong>Graphite</strong></li>
      <li><span>Known title</span><strong>3</strong></li>
      <li><span>Chip share</span><strong>33%</strong></li>
    </ul>
    <div class="c4-ttl-chart" aria-label="Lane counts">
      <button type="button" class="c4-ttl-bar" data-on="1"><i style="height:100%"></i><strong>1</strong><span>Short word</span></button>
      <button type="button" class="c4-ttl-bar"><i style="height:100%"></i><strong>1</strong><span>One join</span></button>
      <button type="button" class="c4-ttl-bar"><i style="height:100%"></i><strong>1</strong><span>Long word</span></button>
    </div>
    <ol class="c4-ttl-board">
      <li class="c4-ttl-card" data-on="1" data-lane="chip" data-hue="champagne"><p class="c4-ttl-stamp">LYST</p><div><strong>Ada</strong><p class="c4-ttl-meta">Short word · Champagne · Letter count 7</p></div></li>
      <li class="c4-ttl-card" data-lane="post" data-hue="graphite" data-reviewed="1"><p class="c4-ttl-stamp">ATOR</p><div><strong>Bea</strong><p class="c4-ttl-meta">Long word · Graphite · Letter count 13</p></div></li>
      <li class="c4-ttl-card" data-lane="pair" data-hue="graphite"><p class="c4-ttl-stamp">AGER</p><div><strong>Cem</strong><p class="c4-ttl-meta">One join · Graphite · Letter count 12</p></div></li>
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
  ["crm-round262-larder-before-light.png", "light", before, false],
  ["crm-round262-larder-after-light.png", "light", after, false],
  ["crm-round262-larder-after-dark.png", "dark", after, false],
  ["crm-round262-larder-after-mobile.png", "light", after, true],
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
