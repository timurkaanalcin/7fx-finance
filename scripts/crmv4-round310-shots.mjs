/** Before/after shots for the ivory break caldarium and the graphite lounge triclinium. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-break" aria-label="Break notes" data-break="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-brk-logo" data-logo="mono">7FX</p>
        <p class="c4-pay-kicker">Corners</p>
        <h2 class="c4-title">Break notes</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short break note stays in this browser.</p>
    <ul class="c4-brk-rows">
      <li data-pinned="1"><p>Hold the north corner</p><p class="c4-meta">Tea</p></li>
      <li data-pinned="0"><p>Leave the spare chair</p></li>
    </ul>
  </section>
  <section class="c4-lounge" aria-label="Lounge notes" data-lounge="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-lng-logo" data-logo="mono">7FX</p>
        <p class="c4-pay-kicker">Zones</p>
        <h2 class="c4-title">Lounge notes</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short lounge note stays in this browser.</p>
    <ul class="c4-lng-rows">
      <li data-pinned="1"><p>Keep the quiet zone clear</p><p class="c4-meta">West</p></li>
      <li data-pinned="0"><p>Close the late lounge</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-break c4-break-caldarium" aria-label="Break notes" data-break="1" data-desk="caldarium">
    <header class="c4-break-caldarium-mast">
      <p class="c4-break-caldarium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-break-caldarium-kicker">Ivory break caldarium</p>
        <h2 class="c4-title c4-break-caldarium-title">Break notes</h2>
        <p class="c4-break-caldarium-lead">Break notes rest in an ivory caldarium. Graphite holds the row. Champagne marks the note in view.</p>
      </div>
      <p class="c4-break-caldarium-count">2</p>
    </header>
    <ol class="c4-break-caldarium-index" aria-label="Break notes">
      <li data-tone="gold">Open notes 2</li>
      <li data-tone="ink">Pinned 1</li>
      <li data-tone="ivory">Hidden 0</li>
    </ol>
    <div class="c4-break-caldarium-chart" aria-label="Break notes">
      <button type="button" class="c4-break-caldarium-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Open notes</span></button>
      <button type="button" class="c4-break-caldarium-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>Pinned</span></button>
      <button type="button" class="c4-break-caldarium-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
    </div>
    <p class="c4-meta c4-break-caldarium-hint">A short break note stays in this browser.</p>
    <ul class="c4-brk-rows c4-break-caldarium-list">
      <li class="c4-break-caldarium-card" data-pinned="1" data-on="1"><p>Hold the north corner</p><p class="c4-meta">Tea</p></li>
      <li class="c4-break-caldarium-card" data-pinned="0" data-on="0"><p>Leave the spare chair</p></li>
    </ul>
  </section>
  <section class="c4-lounge c4-lounge-triclinium" aria-label="Lounge notes" data-lounge="1" data-desk="triclinium">
    <header class="c4-lounge-triclinium-mast">
      <p class="c4-lounge-triclinium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-lounge-triclinium-kicker">Graphite lounge triclinium</p>
        <h2 class="c4-title c4-lounge-triclinium-title">Lounge notes</h2>
        <p class="c4-lounge-triclinium-lead">Lounge notes stand in a graphite triclinium. Ivory holds the row. Champagne marks the note in view.</p>
      </div>
      <p class="c4-lounge-triclinium-count">2</p>
    </header>
    <ol class="c4-lounge-triclinium-index" aria-label="Lounge notes">
      <li data-tone="gold">Shown 2</li>
      <li data-tone="ink">Hidden 0</li>
      <li data-tone="ivory">No zone 1</li>
    </ol>
    <div class="c4-lounge-triclinium-chart" aria-label="Lounge notes">
      <button type="button" class="c4-lounge-triclinium-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Shown</span></button>
      <button type="button" class="c4-lounge-triclinium-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
      <button type="button" class="c4-lounge-triclinium-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>No zone</span></button>
    </div>
    <p class="c4-meta c4-lounge-triclinium-hint">A short lounge note stays in this browser.</p>
    <ul class="c4-lng-rows c4-lounge-triclinium-list">
      <li class="c4-lounge-triclinium-card" data-pinned="1" data-on="1"><p>Keep the quiet zone clear</p><p class="c4-meta">West</p></li>
      <li class="c4-lounge-triclinium-card" data-pinned="0" data-on="0"><p>Close the late lounge</p></li>
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
  ["crm-round310-before-light.png", "light", before, "1280,1700"],
  ["crm-round310-after-light.png", "light", after, "1280,1900"],
  ["crm-round310-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round310-after-mobile.png", "light", after, "390,2200"],
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
