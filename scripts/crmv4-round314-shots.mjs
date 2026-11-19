/** Before/after shots for the ivory lamp exedra and the graphite broker fauces. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-lamp" aria-label="Lamp cards" data-lamp="1">
    <header class="c4-lmp-head">
      <p class="c4-lmp-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Bays</p>
        <h2 class="c4-title">Lamp cards</h2>
      </div>
      <p class="c4-lmp-count">2</p>
    </header>
    <p class="c4-meta">A short lamp card stays in this browser.</p>
    <ul class="c4-lmp-rows">
      <li data-pinned="1" data-lit="0"><span class="c4-lmp-wick" aria-hidden="true"></span><div><p>Trim the north wick</p><p class="c4-lmp-bay">North</p></div></li>
      <li data-pinned="0" data-lit="1"><span class="c4-lmp-wick" aria-hidden="true"></span><div><p>Leave the late lamp</p></div></li>
    </ul>
  </section>
  <section class="c4-broker" aria-label="Broker names" data-broker="1">
    <header class="c4-bkn-head">
      <div>
        <p class="c4-pay-kicker">Names</p>
        <h2 class="c4-title">Broker names</h2>
      </div>
      <p class="c4-lmp-count">Rows 2</p>
    </header>
    <p class="c4-meta">Broker names already stored on the account.</p>
    <ul class="c4-bkn-rows">
      <li data-broker="North"><span class="c4-bkn-spine" aria-hidden="true"></span><p>Ada North</p><p class="c4-meta">North</p></li>
      <li data-broker="blank"><span class="c4-bkn-spine" aria-hidden="true"></span><p>Bea</p><p class="c4-meta">No name</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-lamp c4-lamp-exedra" aria-label="Lamp cards" data-lamp="1" data-desk="exedra">
    <header class="c4-lamp-exedra-mast">
      <p class="c4-lamp-exedra-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-lamp-exedra-kicker">Ivory lamp exedra</p>
        <h2 class="c4-title c4-lamp-exedra-title">Lamp cards</h2>
        <p class="c4-lamp-exedra-lead">Lamp cards rest in an ivory exedra. Graphite holds the bay. Champagne marks the card in view.</p>
      </div>
      <p class="c4-lamp-exedra-count">2</p>
    </header>
    <ol class="c4-lamp-exedra-index" aria-label="Lamp cards">
      <li data-tone="gold">Dark cards 1</li>
      <li data-tone="ink">Lit cards 1</li>
      <li data-tone="ivory">Held cards 0</li>
    </ol>
    <div class="c4-lamp-exedra-chart" aria-label="Lamp cards">
      <button type="button" class="c4-lamp-exedra-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Dark cards</span></button>
      <button type="button" class="c4-lamp-exedra-column" data-on="0"><i style="height:72px"></i><strong>1</strong><span>Lit cards</span></button>
      <button type="button" class="c4-lamp-exedra-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Held cards</span></button>
    </div>
    <p class="c4-meta c4-lamp-exedra-hint">A short lamp card stays in this browser.</p>
    <ul class="c4-lmp-rows c4-lamp-exedra-list">
      <li class="c4-lamp-exedra-card" data-pinned="1" data-on="1"><p>Trim the north wick</p><p class="c4-meta">North</p><div class="c4-row"><button type="button" class="c4-btn">Unpin</button><button type="button" class="c4-btn">Light</button></div></li>
      <li class="c4-lamp-exedra-card" data-pinned="0" data-on="0"><p>Leave the late lamp</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Return</button></div></li>
    </ul>
  </section>
  <section class="c4-broker c4-broker-fauces" aria-label="Broker names" data-broker="1" data-desk="fauces">
    <header class="c4-broker-fauces-mast">
      <p class="c4-broker-fauces-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-broker-fauces-kicker">Graphite broker fauces</p>
        <h2 class="c4-title c4-broker-fauces-title">Broker names</h2>
        <p class="c4-broker-fauces-lead">Broker names stand in a graphite fauces. Ivory holds the name. Champagne marks the row in view.</p>
      </div>
      <p class="c4-broker-fauces-count">2</p>
    </header>
    <ol class="c4-broker-fauces-index" aria-label="Broker names">
      <li data-tone="gold">Named 1</li>
      <li data-tone="ink">No name 1</li>
      <li data-tone="ivory">Hidden 0</li>
    </ol>
    <div class="c4-broker-fauces-chart" aria-label="Broker names">
      <button type="button" class="c4-broker-fauces-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Named</span></button>
      <button type="button" class="c4-broker-fauces-column" data-on="0"><i style="height:72px"></i><strong>1</strong><span>No name</span></button>
      <button type="button" class="c4-broker-fauces-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
    </div>
    <p class="c4-meta c4-broker-fauces-hint">Broker names already stored on the account.</p>
    <ul class="c4-bkn-rows c4-broker-fauces-list">
      <li class="c4-broker-fauces-card" data-on="1"><p>Ada North</p><p class="c4-meta">North</p></li>
      <li class="c4-broker-fauces-card" data-on="0"><p>Bea</p><p class="c4-meta">No name</p></li>
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
  ["crm-round314-before-light.png", "light", before, "1280,1700"],
  ["crm-round314-after-light.png", "light", after, "1280,1900"],
  ["crm-round314-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round314-after-mobile.png", "light", after, "390,2200"],
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
