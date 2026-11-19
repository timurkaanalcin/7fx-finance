/** Before/after shots for the ivory ribbon laconicum and the graphite reason sudatorium. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-rib" aria-label="Ribbon cards" data-ribbon="1">
    <header class="c4-rib-head">
      <p class="c4-rib-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">This shift</p>
        <h2 class="c4-title">Ribbon cards</h2>
      </div>
      <p class="c4-rib-count">2</p>
    </header>
    <p class="c4-meta">A short ribbon stays in this browser.</p>
    <ul class="c4-rib-rows">
      <li data-band="mid"><span class="c4-rib-hour">09</span><div><p>North bay ribbon</p><p class="c4-meta">Open · Floor</p></div></li>
      <li data-band="low"><span class="c4-rib-hour">14</span><div><p>East aisle note</p><p class="c4-meta">Held</p></div></li>
    </ul>
  </section>
  <section class="c4-reason" aria-label="Invalid reasons" data-reason="1">
    <header class="c4-rsn-head">
      <div>
        <p class="c4-pay-kicker">Reasons</p>
        <h2 class="c4-title">Invalid reasons</h2>
      </div>
      <p class="c4-rib-count">Rows 2</p>
    </header>
    <p class="c4-meta">Reason already stored on the account.</p>
    <ul class="c4-rsn-rows">
      <li data-reason="duplicate"><span class="c4-rsn-spine"></span><p>Ada North</p><p class="c4-meta">duplicate</p></li>
      <li data-reason="blank"><span class="c4-rsn-spine"></span><p>Bea</p><p class="c4-meta">No reason</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-rib c4-rib-laconicum" aria-label="Ribbon cards" data-ribbon="1" data-desk="laconicum">
    <header class="c4-rib-laconicum-mast">
      <p class="c4-rib-laconicum-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-rib-laconicum-kicker">Ivory ribbon laconicum</p>
        <h2 class="c4-title c4-rib-laconicum-title">Ribbon cards</h2>
        <p class="c4-rib-laconicum-lead">Ribbon cards rest in an ivory laconicum. Graphite holds the bench. Champagne marks the card in view.</p>
      </div>
      <p class="c4-rib-laconicum-count">2</p>
    </header>
    <ol class="c4-rib-laconicum-index" aria-label="Ivory ribbon laconicum">
      <li data-tone="gold">Open 1</li>
      <li data-tone="ink">Held 1</li>
      <li data-tone="ivory">Done 0</li>
    </ol>
    <p class="c4-meta">A short ribbon stays in this browser.</p>
    <ul class="c4-rib-rows">
      <li class="c4-rib-laconicum-card" data-on="1"><span class="c4-rib-hour">09</span><div><p>North bay ribbon</p><p class="c4-meta">Open · Floor</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Copy</button></div></div></li>
      <li class="c4-rib-laconicum-card" data-on="0"><span class="c4-rib-hour">14</span><div><p>East aisle note</p><p class="c4-meta">Held</p><div class="c4-row"><button type="button" class="c4-btn">Release</button><button type="button" class="c4-btn">Edit</button></div></div></li>
    </ul>
  </section>
  <section class="c4-reason c4-reason-sudatorium" aria-label="Invalid reasons" data-reason="1" data-desk="sudatorium">
    <header class="c4-reason-sudatorium-mast">
      <p class="c4-reason-sudatorium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-reason-sudatorium-kicker">Graphite reason sudatorium</p>
        <h2 class="c4-title c4-reason-sudatorium-title">Invalid reasons</h2>
        <p class="c4-reason-sudatorium-lead">Invalid reasons stand in a graphite sudatorium. Ivory holds the row. Champagne marks the reason in view.</p>
      </div>
      <p class="c4-reason-sudatorium-count">2</p>
    </header>
    <ol class="c4-reason-sudatorium-index" aria-label="Graphite reason sudatorium">
      <li data-tone="gold">Leading duplicate</li>
      <li data-tone="ink">Rows 2</li>
      <li data-tone="ivory">Blank 1</li>
    </ol>
    <div class="c4-reason-sudatorium-chart" aria-label="Family">
      <button type="button" class="c4-reason-sudatorium-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Duplicate</span></button>
      <button type="button" class="c4-reason-sudatorium-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>Blank</span></button>
      <button type="button" class="c4-reason-sudatorium-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Other</span></button>
    </div>
    <p class="c4-meta">Reason already stored on the account.</p>
    <ul class="c4-rsn-rows">
      <li class="c4-reason-sudatorium-card" data-on="1"><span class="c4-rsn-spine"></span><p>Ada North</p><p class="c4-meta">duplicate</p></li>
      <li class="c4-reason-sudatorium-card" data-on="0"><span class="c4-rsn-spine"></span><p>Bea</p><p class="c4-meta">No reason</p></li>
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
  ["crm-round323-before-light.png", "light", before, "1280,1500"],
  ["crm-round323-after-light.png", "light", after, "1280,1900"],
  ["crm-round323-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round323-after-mobile.png", "light", after, "390,2200"],
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
