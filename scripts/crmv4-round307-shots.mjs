/** Before/after shots for the ivory visitor prothyron and the graphite method hypostyle. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-visitor" aria-label="Visitor notes" data-visitor="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-bdg-logo" data-logo="mono">7FX</p>
        <p class="c4-pay-kicker">Desk slips</p>
        <h2 class="c4-title">Visitor notes</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short visitor note stays in this browser.</p>
    <ul class="c4-bdg-rows">
      <li data-pinned="1"><p>Hold the visitor badge</p><p class="c4-meta">North desk</p></li>
      <li data-pinned="0"><p>Leave the slip</p></li>
    </ul>
  </section>
  <section class="c4-dep-glance" aria-label="Deposit methods" data-dep-glance="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Funding</p>
        <h2 class="c4-title">Deposit methods</h2>
      </div>
      <p class="c4-meta">Rows 2</p>
    </header>
    <p class="c4-meta">Methods stay on the loaded deposits.</p>
    <ul class="c4-dmg-rows">
      <li data-method="Wire"><p>Ada Lane</p><p class="c4-meta">Wire</p></li>
      <li data-method="Card"><p>Bea Holt</p><p class="c4-meta">Card</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-visitor c4-visitor-prothyron" aria-label="Visitor notes" data-visitor="1" data-desk="prothyron">
    <header class="c4-visitor-prothyron-mast">
      <p class="c4-visitor-prothyron-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-visitor-prothyron-kicker">Ivory visitor prothyron</p>
        <h2 class="c4-title c4-visitor-prothyron-title">Visitor notes</h2>
        <p class="c4-visitor-prothyron-lead">Visitor notes rest in an ivory prothyron. Graphite holds the row. Champagne marks the note in view.</p>
      </div>
      <p class="c4-visitor-prothyron-count">2</p>
    </header>
    <ol class="c4-visitor-prothyron-index" aria-label="Visitor notes">
      <li data-tone="gold">Open notes 2</li>
      <li data-tone="ink">Pinned 1</li>
      <li data-tone="ivory">Hidden 0</li>
    </ol>
    <div class="c4-visitor-prothyron-chart" aria-label="Visitor notes">
      <button type="button" class="c4-visitor-prothyron-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Open notes</span></button>
      <button type="button" class="c4-visitor-prothyron-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>Pinned</span></button>
      <button type="button" class="c4-visitor-prothyron-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
    </div>
    <p class="c4-meta c4-visitor-prothyron-hint">A short visitor note stays in this browser.</p>
    <ul class="c4-bdg-rows c4-visitor-prothyron-list">
      <li class="c4-visitor-prothyron-card" data-pinned="1" data-on="1"><p>Hold the visitor badge</p><p class="c4-meta">North desk</p></li>
      <li class="c4-visitor-prothyron-card" data-pinned="0" data-on="0"><p>Leave the slip</p></li>
    </ul>
  </section>
  <section class="c4-dep-glance c4-method-hypostyle" aria-label="Deposit methods" data-dep-glance="1" data-desk="hypostyle">
    <header class="c4-method-hypostyle-mast">
      <p class="c4-method-hypostyle-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-method-hypostyle-kicker">Graphite method hypostyle</p>
        <h2 class="c4-title c4-method-hypostyle-title">Deposit methods</h2>
        <p class="c4-method-hypostyle-lead">Deposit methods stand in a graphite hypostyle. Ivory holds the row. Champagne marks the method in view.</p>
      </div>
      <p class="c4-method-hypostyle-count">2</p>
    </header>
    <ol class="c4-method-hypostyle-index" aria-label="Deposit methods">
      <li data-tone="gold">Shown 2</li>
      <li data-tone="ink">Hidden 0</li>
      <li data-tone="ivory">Blank 0</li>
    </ol>
    <div class="c4-method-hypostyle-chart" aria-label="Deposit methods">
      <button type="button" class="c4-method-hypostyle-column" data-on="1"><i style="height:72px"></i><strong>3</strong><span>Wire</span></button>
      <button type="button" class="c4-method-hypostyle-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>Card</span></button>
    </div>
    <p class="c4-meta c4-method-hypostyle-hint">Methods stay on the loaded deposits.</p>
    <ul class="c4-dmg-rows c4-method-hypostyle-list">
      <li class="c4-method-hypostyle-card" data-method="Wire" data-on="1"><p>Ada Lane</p><p class="c4-meta">Wire</p></li>
      <li class="c4-method-hypostyle-card" data-method="Card" data-on="0"><p>Bea Holt</p><p class="c4-meta">Card</p></li>
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
  ["crm-round307-before-light.png", "light", before, "1280,1700"],
  ["crm-round307-after-light.png", "light", after, "1280,1900"],
  ["crm-round307-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round307-after-mobile.png", "light", after, "390,2200"],
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
