/** Before/after shots for the ivory playbill unctorium and the graphite source natatio. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-ply" aria-label="Playbill cards" data-playbill="1">
    <header class="c4-ply-head">
      <p class="c4-ply-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">This shift</p>
        <h2 class="c4-title">Playbill cards</h2>
      </div>
      <p class="c4-ply-count">2</p>
    </header>
    <p class="c4-meta">A short playbill stays in this browser.</p>
    <ul class="c4-ply-rows">
      <li data-band="mid"><span class="c4-ply-act">I</span><div><p>North bay cue</p><p class="c4-meta">Open · Floor</p></div></li>
      <li data-band="low"><span class="c4-ply-act">II</span><div><p>East aisle note</p><p class="c4-meta">Held</p></div></li>
    </ul>
  </section>
  <section class="c4-ivs" aria-label="Invalid sources" data-ivsource="1">
    <header class="c4-ivs-head">
      <div>
        <p class="c4-pay-kicker">Sources</p>
        <h2 class="c4-title">Invalid sources</h2>
      </div>
      <p class="c4-ply-count">Rows 2</p>
    </header>
    <p class="c4-meta">Source already stored on the account.</p>
    <ul class="c4-ivs-rows">
      <li data-source="web"><span class="c4-ivs-spine"></span><p>Ada North</p><p class="c4-meta">web</p></li>
      <li data-source="blank"><span class="c4-ivs-spine"></span><p>Bea</p><p class="c4-meta">No source</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-ply c4-ply-unctorium" aria-label="Playbill cards" data-playbill="1" data-desk="unctorium">
    <header class="c4-ply-unctorium-mast">
      <p class="c4-ply-unctorium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-ply-unctorium-kicker">Ivory playbill unctorium</p>
        <h2 class="c4-title c4-ply-unctorium-title">Playbill cards</h2>
        <p class="c4-ply-unctorium-lead">Playbill cards rest in an ivory unctorium. Graphite holds the bench. Champagne marks the card in view.</p>
      </div>
      <p class="c4-ply-unctorium-count">2</p>
    </header>
    <ol class="c4-ply-unctorium-index" aria-label="Ivory playbill unctorium">
      <li data-tone="gold">Open 1</li>
      <li data-tone="ink">Held 1</li>
      <li data-tone="ivory">Done 0</li>
    </ol>
    <p class="c4-meta">A short playbill stays in this browser.</p>
    <ul class="c4-ply-rows">
      <li class="c4-ply-unctorium-card" data-on="1"><span class="c4-ply-act">I</span><div><p>North bay cue</p><p class="c4-meta">Open · Floor</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Copy</button></div></div></li>
      <li class="c4-ply-unctorium-card" data-on="0"><span class="c4-ply-act">II</span><div><p>East aisle note</p><p class="c4-meta">Held</p><div class="c4-row"><button type="button" class="c4-btn">Release</button><button type="button" class="c4-btn">Edit</button></div></div></li>
    </ul>
  </section>
  <section class="c4-ivs c4-ivs-natatio" aria-label="Invalid sources" data-ivsource="1" data-desk="natatio">
    <header class="c4-ivs-natatio-mast">
      <p class="c4-ivs-natatio-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-ivs-natatio-kicker">Graphite source natatio</p>
        <h2 class="c4-title c4-ivs-natatio-title">Invalid sources</h2>
        <p class="c4-ivs-natatio-lead">Invalid sources stand in a graphite natatio. Ivory holds the waterline. Champagne marks the source in view.</p>
      </div>
      <p class="c4-ivs-natatio-count">2</p>
    </header>
    <ol class="c4-ivs-natatio-index" aria-label="Graphite source natatio">
      <li data-tone="gold">Leading web</li>
      <li data-tone="ink">Rows 2</li>
      <li data-tone="ivory">Blank 1</li>
    </ol>
    <div class="c4-ivs-natatio-chart" aria-label="Kind">
      <button type="button" class="c4-ivs-natatio-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Web</span></button>
      <button type="button" class="c4-ivs-natatio-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>Blank</span></button>
      <button type="button" class="c4-ivs-natatio-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Other</span></button>
    </div>
    <p class="c4-meta">Source already stored on the account.</p>
    <ul class="c4-ivs-rows">
      <li class="c4-ivs-natatio-card" data-on="1"><span class="c4-ivs-spine"></span><p>Ada North</p><p class="c4-meta">web</p></li>
      <li class="c4-ivs-natatio-card" data-on="0"><span class="c4-ivs-spine"></span><p>Bea</p><p class="c4-meta">No source</p></li>
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
  ["crm-round324-before-light.png", "light", before, "1280,1500"],
  ["crm-round324-after-light.png", "light", after, "1280,1900"],
  ["crm-round324-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round324-after-mobile.png", "light", after, "390,2200"],
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
