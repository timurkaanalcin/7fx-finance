/** Before/after shots for the ivory supply cryptoporticus and the graphite room diaeta. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-supply" aria-label="Supply notes" data-supply="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-spl-logo" data-logo="mono">7FX</p>
        <p class="c4-pay-kicker">Desk bins</p>
        <h2 class="c4-title">Supply notes</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short supply note stays in this browser.</p>
    <ul class="c4-spl-rows">
      <li data-pinned="1"><p>Hold the ivory bin</p><p class="c4-meta">North shelf</p></li>
      <li data-pinned="0"><p>Leave the spare slip</p></li>
    </ul>
  </section>
  <section class="c4-room" aria-label="Room notes" data-room="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-rmn-logo" data-logo="mono">7FX</p>
        <p class="c4-pay-kicker">Floors</p>
        <h2 class="c4-title">Room notes</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short room note stays in this browser.</p>
    <ul class="c4-rmn-rows">
      <li data-pinned="1"><p>Keep the east floor clear</p><p class="c4-meta">Level 2</p></li>
      <li data-pinned="0"><p>Close the quiet room</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-supply c4-supply-cryptoporticus" aria-label="Supply notes" data-supply="1" data-desk="cryptoporticus">
    <header class="c4-supply-cryptoporticus-mast">
      <p class="c4-supply-cryptoporticus-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-supply-cryptoporticus-kicker">Ivory supply cryptoporticus</p>
        <h2 class="c4-title c4-supply-cryptoporticus-title">Supply notes</h2>
        <p class="c4-supply-cryptoporticus-lead">Supply notes rest in an ivory cryptoporticus. Graphite holds the row. Champagne marks the note in view.</p>
      </div>
      <p class="c4-supply-cryptoporticus-count">2</p>
    </header>
    <ol class="c4-supply-cryptoporticus-index" aria-label="Supply notes">
      <li data-tone="gold">Open notes 2</li>
      <li data-tone="ink">Pinned 1</li>
      <li data-tone="ivory">Hidden 0</li>
    </ol>
    <div class="c4-supply-cryptoporticus-chart" aria-label="Supply notes">
      <button type="button" class="c4-supply-cryptoporticus-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Open notes</span></button>
      <button type="button" class="c4-supply-cryptoporticus-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>Pinned</span></button>
      <button type="button" class="c4-supply-cryptoporticus-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
    </div>
    <p class="c4-meta c4-supply-cryptoporticus-hint">A short supply note stays in this browser.</p>
    <ul class="c4-spl-rows c4-supply-cryptoporticus-list">
      <li class="c4-supply-cryptoporticus-card" data-pinned="1" data-on="1"><p>Hold the ivory bin</p><p class="c4-meta">North shelf</p></li>
      <li class="c4-supply-cryptoporticus-card" data-pinned="0" data-on="0"><p>Leave the spare slip</p></li>
    </ul>
  </section>
  <section class="c4-room c4-room-diaeta" aria-label="Room notes" data-room="1" data-desk="diaeta">
    <header class="c4-room-diaeta-mast">
      <p class="c4-room-diaeta-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-room-diaeta-kicker">Graphite room diaeta</p>
        <h2 class="c4-title c4-room-diaeta-title">Room notes</h2>
        <p class="c4-room-diaeta-lead">Room notes stand in a graphite diaeta. Ivory holds the row. Champagne marks the note in view.</p>
      </div>
      <p class="c4-room-diaeta-count">2</p>
    </header>
    <ol class="c4-room-diaeta-index" aria-label="Room notes">
      <li data-tone="gold">Shown 2</li>
      <li data-tone="ink">Hidden 0</li>
      <li data-tone="ivory">No floor 1</li>
    </ol>
    <div class="c4-room-diaeta-chart" aria-label="Room notes">
      <button type="button" class="c4-room-diaeta-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Shown</span></button>
      <button type="button" class="c4-room-diaeta-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
      <button type="button" class="c4-room-diaeta-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>No floor</span></button>
    </div>
    <p class="c4-meta c4-room-diaeta-hint">A short room note stays in this browser.</p>
    <ul class="c4-rmn-rows c4-room-diaeta-list">
      <li class="c4-room-diaeta-card" data-pinned="1" data-on="1"><p>Keep the east floor clear</p><p class="c4-meta">Level 2</p></li>
      <li class="c4-room-diaeta-card" data-pinned="0" data-on="0"><p>Close the quiet room</p></li>
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
  ["crm-round309-before-light.png", "light", before, "1280,1700"],
  ["crm-round309-after-light.png", "light", after, "1280,1900"],
  ["crm-round309-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round309-after-mobile.png", "light", after, "390,2200"],
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
