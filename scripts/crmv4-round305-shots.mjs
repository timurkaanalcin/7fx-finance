/** Before/after shots for the ivory courier narthex and the graphite partner stoa. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-courier" aria-label="Courier notes" data-courier="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-crr-logo" data-logo="mono">7FX</p>
        <p class="c4-pay-kicker">Desk slips</p>
        <h2 class="c4-title">Courier notes</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short courier note stays in this browser.</p>
    <ul class="c4-crr-rows">
      <li data-pinned="1"><p>Hold the locker key</p><p class="c4-meta">North desk</p></li>
      <li data-pinned="0"><p>Leave the slip</p></li>
    </ul>
  </section>
  <section class="c4-ib-ctry" aria-label="IB countries" data-ib-ctry="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Partner book</p>
        <h2 class="c4-title">IB countries</h2>
      </div>
      <p class="c4-meta">Rows 2</p>
    </header>
    <p class="c4-meta">Countries stay on the loaded partners.</p>
    <ul class="c4-ibg-rows">
      <li data-country="DE"><p>Ada Lane</p><p class="c4-meta">North desk</p><p class="c4-meta">DE</p></li>
      <li data-country="TR"><p>Bea Holt</p><p class="c4-meta">South desk</p><p class="c4-meta">TR</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-courier c4-courier-narthex" aria-label="Courier notes" data-courier="1" data-desk="narthex">
    <header class="c4-courier-narthex-mast">
      <p class="c4-courier-narthex-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-courier-narthex-kicker">Ivory courier narthex</p>
        <h2 class="c4-title c4-courier-narthex-title">Courier notes</h2>
        <p class="c4-courier-narthex-lead">Courier notes rest in an ivory narthex. Graphite holds the row. Champagne marks the note in view.</p>
      </div>
      <p class="c4-courier-narthex-count">2</p>
    </header>
    <ol class="c4-courier-narthex-index" aria-label="Courier notes">
      <li data-tone="gold">Open notes 2</li>
      <li data-tone="ink">Pinned 1</li>
      <li data-tone="ivory">Hidden 0</li>
    </ol>
    <div class="c4-courier-narthex-chart" aria-label="Courier notes">
      <button type="button" class="c4-courier-narthex-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Open notes</span></button>
      <button type="button" class="c4-courier-narthex-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>Pinned</span></button>
      <button type="button" class="c4-courier-narthex-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
    </div>
    <p class="c4-meta c4-courier-narthex-hint">A short courier note stays in this browser.</p>
    <ul class="c4-crr-rows c4-courier-narthex-list">
      <li class="c4-courier-narthex-card" data-pinned="1" data-on="1"><p>Hold the locker key</p><p class="c4-meta">North desk</p></li>
      <li class="c4-courier-narthex-card" data-pinned="0" data-on="0"><p>Leave the slip</p></li>
    </ul>
  </section>
  <section class="c4-ib-ctry c4-partner-stoa" aria-label="IB countries" data-ib-ctry="1" data-desk="stoa">
    <header class="c4-partner-stoa-mast">
      <p class="c4-partner-stoa-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-partner-stoa-kicker">Graphite partner stoa</p>
        <h2 class="c4-title c4-partner-stoa-title">IB countries</h2>
        <p class="c4-partner-stoa-lead">Partner countries stand in a graphite stoa. Ivory holds the row. Champagne marks the country in view.</p>
      </div>
      <p class="c4-partner-stoa-count">2</p>
    </header>
    <ol class="c4-partner-stoa-index" aria-label="IB countries">
      <li data-tone="gold">Shown 2</li>
      <li data-tone="ink">Hidden 0</li>
      <li data-tone="ivory">Blank 0</li>
    </ol>
    <div class="c4-partner-stoa-chart" aria-label="IB countries">
      <button type="button" class="c4-partner-stoa-column" data-on="1"><i style="height:72px"></i><strong>3</strong><span>DE</span></button>
      <button type="button" class="c4-partner-stoa-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>TR</span></button>
    </div>
    <p class="c4-meta c4-partner-stoa-hint">Countries stay on the loaded partners.</p>
    <ul class="c4-ibg-rows c4-partner-stoa-list">
      <li class="c4-partner-stoa-card" data-country="DE" data-on="1"><p>Ada Lane</p><p class="c4-meta">North desk</p><p class="c4-meta">DE</p></li>
      <li class="c4-partner-stoa-card" data-country="TR" data-on="0"><p>Bea Holt</p><p class="c4-meta">South desk</p><p class="c4-meta">TR</p></li>
    </ul>
  </section>`;

function page(theme, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${css}
    body { margin: 0; background: ${theme === "dark" ? "#12100e" : "#f4f0e8"}; }
    [data-crmv4-root] { height: auto; display: block; background: ${theme === "dark" ? "#12100e" : "#f4f0e8"}; }
  </style></head>
  <body>
    <div data-crmv4-root data-theme="${theme}">
      <div style="max-width:960px;margin:0 auto;padding:24px 16px 48px;display:grid;gap:28px;">
        ${body}
      </div>
    </div>
  </body></html>`;
}

const shots = [
  ["crm-round305-before-light.png", "light", before, "1280,1700"],
  ["crm-round305-after-light.png", "light", after, "1280,1900"],
  ["crm-round305-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round305-after-mobile.png", "light", after, "390,2200"],
];

for (const [name, theme, body, size] of shots) {
  const htmlPath = `/tmp/${name}.html`;
  fs.writeFileSync(htmlPath, page(theme, body));
  const result = spawnSync("/opt/google/chrome/chrome", [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--virtual-time-budget=4000",
    "--timeout=8000",
    `--window-size=${size}`,
    `--screenshot=${out}/${name}`,
    `file://${htmlPath}`,
  ], { encoding: "utf8", timeout: 30000 });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  console.log("wrote", name);
}
