/** Before/after shots for the ivory locker aedicula and the graphite symbol peristyle. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-locker" aria-label="Locker notes" data-locker="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-lok-logo" data-logo="mono">7FX</p>
        <p class="c4-pay-kicker">Desk slips</p>
        <h2 class="c4-title">Locker notes</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short locker note stays in this browser.</p>
    <ul class="c4-lok-rows">
      <li data-pinned="1"><p>Hold the locker key</p><p class="c4-meta">North desk</p></li>
      <li data-pinned="0"><p>Leave the slip</p></li>
    </ul>
  </section>
  <section class="c4-trade-sym" aria-label="Trade symbols" data-trade-sym="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Book</p>
        <h2 class="c4-title">Trade symbols</h2>
      </div>
      <p class="c4-meta">Rows 2</p>
    </header>
    <p class="c4-meta">Symbols stay on the loaded orders.</p>
    <ul class="c4-tsy-rows">
      <li data-symbol="EURUSD"><p>Ada Lane</p><p class="c4-meta">EURUSD</p><p class="c4-meta">Order</p></li>
      <li data-symbol="XAUUSD"><p>Bea Holt</p><p class="c4-meta">XAUUSD</p><p class="c4-meta">Position</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-locker c4-locker-aedicula" aria-label="Locker notes" data-locker="1" data-desk="aedicula">
    <header class="c4-locker-aedicula-mast">
      <p class="c4-locker-aedicula-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-locker-aedicula-kicker">Ivory locker aedicula</p>
        <h2 class="c4-title c4-locker-aedicula-title">Locker notes</h2>
        <p class="c4-locker-aedicula-lead">Locker notes rest in an ivory aedicula. Graphite holds the row. Champagne marks the note in view.</p>
      </div>
      <p class="c4-locker-aedicula-count">2</p>
    </header>
    <ol class="c4-locker-aedicula-index" aria-label="Locker notes">
      <li data-tone="gold">Open notes 2</li>
      <li data-tone="ink">Pinned 1</li>
      <li data-tone="ivory">Hidden 0</li>
    </ol>
    <div class="c4-locker-aedicula-chart" aria-label="Locker notes">
      <button type="button" class="c4-locker-aedicula-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Open notes</span></button>
      <button type="button" class="c4-locker-aedicula-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>Pinned</span></button>
      <button type="button" class="c4-locker-aedicula-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
    </div>
    <p class="c4-meta c4-locker-aedicula-hint">A short locker note stays in this browser.</p>
    <ul class="c4-lok-rows c4-locker-aedicula-list">
      <li class="c4-locker-aedicula-card" data-pinned="1" data-on="1"><p>Hold the locker key</p><p class="c4-meta">North desk</p></li>
      <li class="c4-locker-aedicula-card" data-pinned="0" data-on="0"><p>Leave the slip</p></li>
    </ul>
  </section>
  <section class="c4-trade-sym c4-symbol-peristyle" aria-label="Trade symbols" data-trade-sym="1" data-desk="peristyle">
    <header class="c4-symbol-peristyle-mast">
      <p class="c4-symbol-peristyle-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-symbol-peristyle-kicker">Graphite symbol peristyle</p>
        <h2 class="c4-title c4-symbol-peristyle-title">Trade symbols</h2>
        <p class="c4-symbol-peristyle-lead">Trade symbols stand in a graphite peristyle. Ivory holds the row. Champagne marks the symbol in view.</p>
      </div>
      <p class="c4-symbol-peristyle-count">2</p>
    </header>
    <ol class="c4-symbol-peristyle-index" aria-label="Trade symbols">
      <li data-tone="gold">Shown 2</li>
      <li data-tone="ink">Hidden 0</li>
      <li data-tone="ivory">Blank 0</li>
    </ol>
    <div class="c4-symbol-peristyle-chart" aria-label="Trade symbols">
      <button type="button" class="c4-symbol-peristyle-column" data-on="1"><i style="height:72px"></i><strong>3</strong><span>EURUSD</span></button>
      <button type="button" class="c4-symbol-peristyle-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>XAUUSD</span></button>
    </div>
    <p class="c4-meta c4-symbol-peristyle-hint">Symbols stay on the loaded orders.</p>
    <ul class="c4-tsy-rows c4-symbol-peristyle-list">
      <li class="c4-symbol-peristyle-card" data-symbol="EURUSD" data-on="1"><p>Ada Lane</p><p class="c4-meta">EURUSD</p><p class="c4-meta">Order</p></li>
      <li class="c4-symbol-peristyle-card" data-symbol="XAUUSD" data-on="0"><p>Bea Holt</p><p class="c4-meta">XAUUSD</p><p class="c4-meta">Position</p></li>
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
  ["crm-round306-before-light.png", "light", before, "1280,1700"],
  ["crm-round306-after-light.png", "light", after, "1280,1900"],
  ["crm-round306-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round306-after-mobile.png", "light", after, "390,2200"],
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
