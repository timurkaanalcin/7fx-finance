/** Before/after shots for the ivory concierge tablinum and the graphite valet cubiculum. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-concierge" aria-label="Concierge notes" data-concierge="1">
    <header class="c4-cnc-head">
      <p class="c4-cnc-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Errands</p>
        <h2 class="c4-title">Concierge notes</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">A short concierge note stays in this browser.</p>
    <ul class="c4-cnc-rows">
      <li data-pinned="1"><div><p>Hold the noon key</p><p class="c4-cnc-errand">North desk</p></div></li>
      <li data-pinned="0"><div><p>Leave the late card</p></div></li>
    </ul>
  </section>
  <section class="c4-valet" aria-label="Valet notes" data-valet="1">
    <header class="c4-vlt-head">
      <p class="c4-vlt-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Stands</p>
        <h2 class="c4-title">Valet notes</h2>
      </div>
      <p class="c4-vlt-count">2</p>
    </header>
    <p class="c4-meta">A short valet note stays in this browser.</p>
    <ul class="c4-vlt-rows">
      <li data-pinned="1"><span class="c4-vlt-perf" aria-hidden="true"></span><div><p>Keep the quiet stand clear</p><p class="c4-vlt-stand">West</p></div></li>
      <li data-pinned="0"><span class="c4-vlt-perf" aria-hidden="true"></span><div><p>Close the late rack</p></div></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-concierge c4-concierge-tablinum" aria-label="Concierge notes" data-concierge="1" data-desk="tablinum">
    <header class="c4-concierge-tablinum-mast">
      <p class="c4-concierge-tablinum-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-concierge-tablinum-kicker">Ivory concierge tablinum</p>
        <h2 class="c4-title c4-concierge-tablinum-title">Concierge notes</h2>
        <p class="c4-concierge-tablinum-lead">Concierge notes rest in an ivory tablinum. Graphite holds the errand. Champagne marks the note in view.</p>
      </div>
      <p class="c4-concierge-tablinum-count">2</p>
    </header>
    <ol class="c4-concierge-tablinum-index" aria-label="Concierge notes">
      <li data-tone="gold">Open notes 2</li>
      <li data-tone="ink">Pinned 1</li>
      <li data-tone="ivory">No errand 1</li>
    </ol>
    <div class="c4-concierge-tablinum-chart" aria-label="Concierge notes">
      <button type="button" class="c4-concierge-tablinum-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Open notes</span></button>
      <button type="button" class="c4-concierge-tablinum-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>Pinned</span></button>
      <button type="button" class="c4-concierge-tablinum-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>No errand</span></button>
    </div>
    <p class="c4-meta c4-concierge-tablinum-hint">A short concierge note stays in this browser.</p>
    <ul class="c4-cnc-rows c4-concierge-tablinum-list">
      <li class="c4-concierge-tablinum-card" data-pinned="1" data-on="1"><p>Hold the noon key</p><p class="c4-meta">North desk</p></li>
      <li class="c4-concierge-tablinum-card" data-pinned="0" data-on="0"><p>Leave the late card</p></li>
    </ul>
  </section>
  <section class="c4-valet c4-valet-cubiculum" aria-label="Valet notes" data-valet="1" data-desk="cubiculum">
    <header class="c4-valet-cubiculum-mast">
      <p class="c4-valet-cubiculum-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-valet-cubiculum-kicker">Graphite valet cubiculum</p>
        <h2 class="c4-title c4-valet-cubiculum-title">Valet notes</h2>
        <p class="c4-valet-cubiculum-lead">Valet notes stand in a graphite cubiculum. Ivory holds the stand. Champagne marks the note in view.</p>
      </div>
      <p class="c4-valet-cubiculum-count">2</p>
    </header>
    <ol class="c4-valet-cubiculum-index" aria-label="Valet notes">
      <li data-tone="gold">Shown 2</li>
      <li data-tone="ink">Hidden 0</li>
      <li data-tone="ivory">No stand 1</li>
    </ol>
    <div class="c4-valet-cubiculum-chart" aria-label="Valet notes">
      <button type="button" class="c4-valet-cubiculum-column" data-on="1"><i style="height:72px"></i><strong>2</strong><span>Shown</span></button>
      <button type="button" class="c4-valet-cubiculum-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Hidden</span></button>
      <button type="button" class="c4-valet-cubiculum-column" data-on="1"><i style="height:40px"></i><strong>1</strong><span>No stand</span></button>
    </div>
    <p class="c4-meta c4-valet-cubiculum-hint">A short valet note stays in this browser.</p>
    <ul class="c4-vlt-rows c4-valet-cubiculum-list">
      <li class="c4-valet-cubiculum-card" data-pinned="1" data-on="1"><span class="c4-vlt-perf" aria-hidden="true"></span><div><p>Keep the quiet stand clear</p><p class="c4-vlt-stand">West</p></div><div class="c4-row"><button type="button" class="c4-btn">Unpin</button></div></li>
      <li class="c4-valet-cubiculum-card" data-pinned="0" data-on="0"><span class="c4-vlt-perf" aria-hidden="true"></span><div><p>Close the late rack</p></div><div class="c4-row"><button type="button" class="c4-btn">Pin</button></div></li>
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
  ["crm-round312-before-light.png", "light", before, "1280,1700"],
  ["crm-round312-after-light.png", "light", after, "1280,1900"],
  ["crm-round312-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round312-after-mobile.png", "light", after, "390,2200"],
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
