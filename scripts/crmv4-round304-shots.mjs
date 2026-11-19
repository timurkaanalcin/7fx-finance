/** Before/after shots for the ivory focus oriel and the graphite type aisle. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-focus-customer" aria-label="Focus customer" data-focus-customer="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">One customer</p>
        <h2 class="c4-title">Focus customer</h2>
      </div>
      <p class="c4-meta">1</p>
    </header>
    <p class="c4-meta">Keep one trader in view.</p>
    <p class="c4-meta">The choice stays in this browser.</p>
    <div class="c4-focus-card" data-focus="ada"><p>Ada Lane</p><p class="c4-meta">Focused</p></div>
    <ul class="c4-focus-list">
      <li data-on="1"><p>Ada Lane</p><p class="c4-meta">ada@desk.test</p></li>
      <li data-on="0"><p>Bea Holt</p><p class="c4-meta">bea@desk.test</p></li>
    </ul>
  </section>
  <section class="c4-order-type" aria-label="Order types" data-order-type="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Order book</p>
        <h2 class="c4-title">Order types</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Types stay on the loaded orders.</p>
    <ul class="c4-oy-rows">
      <li data-type="LIMIT"><p>EURUSD</p><p class="c4-meta">LIMIT</p></li>
      <li data-type="MARKET"><p>GBPUSD</p><p class="c4-meta">MARKET</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-focus-customer c4-focus-oriel" aria-label="Focus customer" data-focus-customer="1" data-desk="oriel" data-focused="1">
    <header class="c4-focus-oriel-mast">
      <p class="c4-focus-oriel-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-focus-oriel-kicker">Ivory focus oriel</p>
        <h2 class="c4-title c4-focus-oriel-title">Focus customer</h2>
        <p class="c4-focus-oriel-lead">A focused customer stands in an ivory oriel. Graphite holds the row. Champagne marks the person in view.</p>
      </div>
      <p class="c4-focus-oriel-count">1</p>
    </header>
    <ol class="c4-focus-oriel-index" aria-label="Focus customer">
      <li data-tone="gold">Focused</li>
      <li data-tone="ink">Listed</li>
      <li data-tone="ivory">Open</li>
    </ol>
    <div class="c4-focus-oriel-chart" aria-label="Focus customer">
      <button type="button" class="c4-focus-oriel-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Focused</span></button>
      <button type="button" class="c4-focus-oriel-column" data-on="1"><i style="height:48px"></i><strong>2</strong><span>Listed</span></button>
      <button type="button" class="c4-focus-oriel-column" data-on="1"><i style="height:36px"></i><strong>2</strong><span>Open</span></button>
    </div>
    <p class="c4-meta c4-focus-oriel-hint">Keep one trader in view.</p>
    <div class="c4-focus-card c4-focus-oriel-card" data-focus="ada" data-on="1"><p>Ada Lane</p><p class="c4-meta">Focused</p></div>
    <ul class="c4-focus-list c4-focus-oriel-list">
      <li class="c4-focus-oriel-card" data-on="1"><p>Ada Lane</p><p class="c4-meta">ada@desk.test</p></li>
      <li class="c4-focus-oriel-card" data-on="0"><p>Bea Holt</p><p class="c4-meta">bea@desk.test</p></li>
    </ul>
  </section>
  <section class="c4-order-type c4-type-aisle" aria-label="Order types" data-order-type="1" data-desk="aisle">
    <header class="c4-type-aisle-mast">
      <p class="c4-type-aisle-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-type-aisle-kicker">Graphite type aisle</p>
        <h2 class="c4-title c4-type-aisle-title">Order types</h2>
        <p class="c4-type-aisle-lead">Order types stand in a graphite aisle. Ivory holds the row. Champagne marks the type in view.</p>
      </div>
      <p class="c4-type-aisle-count">2</p>
    </header>
    <ol class="c4-type-aisle-index" aria-label="Order types">
      <li data-tone="gold">Shown</li>
      <li data-tone="ink">Hidden</li>
      <li data-tone="ivory">Blank</li>
    </ol>
    <div class="c4-type-aisle-chart" aria-label="Order types">
      <button type="button" class="c4-type-aisle-column" data-on="1"><i style="height:72px"></i><strong>3</strong><span>LIMIT</span></button>
      <button type="button" class="c4-type-aisle-column" data-on="0"><i style="height:40px"></i><strong>1</strong><span>MARKET</span></button>
      <button type="button" class="c4-type-aisle-column" data-on="0"><i style="height:22px"></i><strong>0</strong><span>Blank</span></button>
    </div>
    <p class="c4-meta c4-type-aisle-hint">Types stay on the loaded orders.</p>
    <ul class="c4-oy-rows c4-type-aisle-list">
      <li class="c4-type-aisle-card" data-type="LIMIT" data-on="1"><p>EURUSD</p><p class="c4-meta">LIMIT</p></li>
      <li class="c4-type-aisle-card" data-type="MARKET" data-on="0"><p>GBPUSD</p><p class="c4-meta">MARKET</p></li>
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
  ["crm-round304-before-light.png", "light", before, "1280,1700"],
  ["crm-round304-after-light.png", "light", after, "1280,1900"],
  ["crm-round304-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round304-after-mobile.png", "light", after, "390,2200"],
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
