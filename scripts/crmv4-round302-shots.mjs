/** Before/after shots for the ivory layout chapel and the graphite document scriptorium. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-layout-lock" aria-label="Layout lock" data-layout-lock="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-lock-logo" data-logo="mono">7FX</p>
        <p class="c4-pay-kicker">Overview panels</p>
        <h2 class="c4-title">Layout lock</h2>
      </div>
      <p class="c4-meta">4</p>
    </header>
    <p class="c4-meta">Panels stay in this browser.</p>
    <ul class="c4-lock-list">
      <li class="c4-lock-card" data-panel="recent" data-on="1"><p>Recent customers</p><p class="c4-meta">Shown</p></li>
      <li class="c4-lock-card" data-panel="alerts" data-on="1"><p>Alerts</p><p class="c4-meta">Shown</p></li>
      <li class="c4-lock-card" data-panel="exposure" data-on="0"><p>Exposure</p><p class="c4-meta">Hidden</p></li>
    </ul>
  </section>
  <section class="c4-doc-mix" aria-label="Document mix" data-doc-mix="1">
    <header class="c4-pay-head">
      <div>
        <p class="c4-pay-kicker">Loaded document types</p>
        <h2 class="c4-title">Document mix</h2>
      </div>
      <p class="c4-meta">2</p>
    </header>
    <p class="c4-meta">Types already stored on the documents.</p>
    <ul class="c4-mix-rows">
      <li data-type="ID"><p>Ada passport scan</p><p class="c4-meta">ID</p></li>
      <li data-type="POA"><p>Bea address letter</p><p class="c4-meta">POA</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-layout-lock c4-layout-chapel" aria-label="Layout lock" data-layout-lock="1" data-desk="chapel" data-locked="0">
    <header class="c4-layout-chapel-mast">
      <p class="c4-layout-chapel-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-layout-chapel-kicker">Ivory layout chapel</p>
        <h2 class="c4-title c4-layout-chapel-title">Layout lock</h2>
        <p class="c4-layout-chapel-lead">Panels sit in an ivory chapel. Graphite holds the row. Champagne marks the panel in view.</p>
      </div>
      <p class="c4-layout-chapel-count">4</p>
    </header>
    <ol class="c4-layout-chapel-index" aria-label="Layout lock">
      <li data-tone="gold">Shown</li>
      <li data-tone="ink">Hidden</li>
      <li data-tone="ivory">Open</li>
    </ol>
    <div class="c4-layout-chapel-chart" aria-label="Layout lock">
      <button type="button" class="c4-layout-chapel-column" data-on="1"><i style="height:88px"></i><strong>4</strong><span>Shown</span></button>
      <button type="button" class="c4-layout-chapel-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>Hidden</span></button>
    </div>
    <p class="c4-meta c4-layout-chapel-hint">Panels stay in this browser.</p>
    <ul class="c4-lock-list c4-layout-chapel-list">
      <li class="c4-lock-card c4-layout-chapel-card" data-panel="recent" data-on="1"><p>Recent customers</p><p class="c4-meta">Shown</p></li>
      <li class="c4-lock-card c4-layout-chapel-card" data-panel="alerts" data-on="1"><p>Alerts</p><p class="c4-meta">Shown</p></li>
      <li class="c4-lock-card c4-layout-chapel-card" data-panel="exposure" data-on="0"><p>Exposure</p><p class="c4-meta">Hidden</p></li>
    </ul>
  </section>
  <section class="c4-doc-mix c4-doc-scriptorium" aria-label="Document mix" data-doc-mix="1" data-desk="scriptorium">
    <header class="c4-doc-scriptorium-mast">
      <p class="c4-doc-scriptorium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-doc-scriptorium-kicker">Graphite document scriptorium</p>
        <h2 class="c4-title c4-doc-scriptorium-title">Document mix</h2>
        <p class="c4-doc-scriptorium-lead">Document types stand in a graphite scriptorium. Ivory holds the row. Champagne marks the type in view.</p>
      </div>
      <p class="c4-doc-scriptorium-count">2</p>
    </header>
    <ol class="c4-doc-scriptorium-index" aria-label="Document mix">
      <li data-tone="gold">Shown</li>
      <li data-tone="ink">Hidden</li>
      <li data-tone="ivory">Blank</li>
    </ol>
    <div class="c4-doc-scriptorium-chart" aria-label="Document mix">
      <button type="button" class="c4-doc-scriptorium-column" data-on="1" data-type="ID"><i style="height:88px"></i><strong>2</strong><span>ID</span></button>
      <button type="button" class="c4-doc-scriptorium-column" data-on="0" data-type="POA"><i style="height:48px"></i><strong>1</strong><span>POA</span></button>
    </div>
    <p class="c4-meta c4-doc-scriptorium-hint">Types already stored on the documents.</p>
    <ul class="c4-mix-rows c4-doc-scriptorium-list">
      <li class="c4-doc-scriptorium-card" data-type="ID" data-on="1"><p>Ada passport scan</p><p class="c4-meta">ID</p></li>
      <li class="c4-doc-scriptorium-card" data-type="POA" data-on="0"><p>Bea address letter</p><p class="c4-meta">POA</p></li>
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
  ["crm-round302-before-light.png", "light", before, "1280,1700"],
  ["crm-round302-after-light.png", "light", after, "1280,1900"],
  ["crm-round302-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round302-after-mobile.png", "light", after, "390,2200"],
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
