/** Before/after shots for the ivory porter oecus and the graphite bell andron. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-porter" aria-label="Porter slips" data-porter="1">
    <header class="c4-prt-head">
      <p class="c4-prt-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Wings</p>
        <h2 class="c4-title">Porter slips</h2>
      </div>
      <p class="c4-prt-count">2</p>
    </header>
    <p class="c4-meta">A short porter slip stays in this browser.</p>
    <ul class="c4-prt-rows">
      <li data-pinned="1" data-called="0"><span class="c4-prt-tab" aria-hidden="true"></span><div><p>Hold the noon key</p><p class="c4-prt-wing">North</p></div></li>
      <li data-pinned="0" data-called="1"><span class="c4-prt-tab" aria-hidden="true"></span><div><p>Leave the late card</p></div></li>
    </ul>
  </section>
  <section class="c4-bell" aria-label="Bell slips" data-bell="1">
    <header class="c4-bll-head">
      <p class="c4-bll-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Floors</p>
        <h2 class="c4-title">Bell slips</h2>
      </div>
      <p class="c4-bll-count">2</p>
    </header>
    <p class="c4-meta">A short bell slip stays in this browser.</p>
    <ul class="c4-bll-rows">
      <li data-pinned="1" data-rung="0"><span class="c4-bll-tab" aria-hidden="true"></span><div><p>Ring the quiet floor</p><p class="c4-bll-floor">West</p></div></li>
      <li data-pinned="0" data-rung="1"><span class="c4-bll-tab" aria-hidden="true"></span><div><p>Close the late rack</p></div></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-porter c4-porter-oecus" aria-label="Porter slips" data-porter="1" data-desk="oecus">
    <header class="c4-porter-oecus-mast">
      <p class="c4-porter-oecus-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-porter-oecus-kicker">Ivory porter oecus</p>
        <h2 class="c4-title c4-porter-oecus-title">Porter slips</h2>
        <p class="c4-porter-oecus-lead">Porter slips rest in an ivory oecus. Graphite holds the wing. Champagne marks the slip in view.</p>
      </div>
      <p class="c4-porter-oecus-count">2</p>
    </header>
    <ol class="c4-porter-oecus-index" aria-label="Porter slips">
      <li data-tone="gold">Open slips 1</li>
      <li data-tone="ink">Called 1</li>
      <li data-tone="ivory">No wing 1</li>
    </ol>
    <div class="c4-porter-oecus-chart" aria-label="Porter slips">
      <button type="button" class="c4-porter-oecus-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Open slips</span></button>
      <button type="button" class="c4-porter-oecus-column" data-on="0"><i style="height:72px"></i><strong>1</strong><span>Called</span></button>
      <button type="button" class="c4-porter-oecus-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>No wing</span></button>
    </div>
    <p class="c4-meta c4-porter-oecus-hint">A short porter slip stays in this browser.</p>
    <ul class="c4-prt-rows c4-porter-oecus-list">
      <li class="c4-porter-oecus-card" data-pinned="1" data-on="1"><p>Hold the noon key</p><p class="c4-meta">North</p><div class="c4-row"><button type="button" class="c4-btn">Unpin</button><button type="button" class="c4-btn">Call</button></div></li>
      <li class="c4-porter-oecus-card" data-pinned="0" data-on="0"><p>Leave the late card</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Uncall</button></div></li>
    </ul>
  </section>
  <section class="c4-bell c4-bell-andron" aria-label="Bell slips" data-bell="1" data-desk="andron">
    <header class="c4-bell-andron-mast">
      <p class="c4-bell-andron-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-bell-andron-kicker">Graphite bell andron</p>
        <h2 class="c4-title c4-bell-andron-title">Bell slips</h2>
        <p class="c4-bell-andron-lead">Bell slips stand in a graphite andron. Ivory holds the floor. Champagne marks the slip in view.</p>
      </div>
      <p class="c4-bell-andron-count">2</p>
    </header>
    <ol class="c4-bell-andron-index" aria-label="Bell slips">
      <li data-tone="gold">Waiting 1</li>
      <li data-tone="ink">Rung 1</li>
      <li data-tone="ivory">No floor 1</li>
    </ol>
    <div class="c4-bell-andron-chart" aria-label="Bell slips">
      <button type="button" class="c4-bell-andron-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Waiting</span></button>
      <button type="button" class="c4-bell-andron-column" data-on="0"><i style="height:72px"></i><strong>1</strong><span>Rung</span></button>
      <button type="button" class="c4-bell-andron-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>No floor</span></button>
    </div>
    <p class="c4-meta c4-bell-andron-hint">A short bell slip stays in this browser.</p>
    <ul class="c4-bll-rows c4-bell-andron-list">
      <li class="c4-bell-andron-card" data-pinned="1" data-on="1"><p>Ring the quiet floor</p><p class="c4-meta">West</p><div class="c4-row"><button type="button" class="c4-btn">Unpin</button><button type="button" class="c4-btn">Ring</button></div></li>
      <li class="c4-bell-andron-card" data-pinned="0" data-on="0"><p>Close the late rack</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Unring</button></div></li>
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
  ["crm-round313-before-light.png", "light", before, "1280,1700"],
  ["crm-round313-after-light.png", "light", after, "1280,1900"],
  ["crm-round313-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round313-after-mobile.png", "light", after, "390,2200"],
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
