/** Before/after shots for the ivory key lararium and the graphite device tepidarium. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-key" aria-label="Key cards" data-key="1">
    <header class="c4-kcd-head">
      <p class="c4-kcd-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Cut keys</p>
        <h2 class="c4-title">Key cards</h2>
      </div>
      <p class="c4-kcd-count">2</p>
    </header>
    <p class="c4-meta">A key card stays in this browser.</p>
    <ul class="c4-kcd-rows">
      <li data-band="mid" data-wing="north"><span class="c4-kcd-spine" aria-hidden="true"></span><div><p>North suite spare</p><p class="c4-kcd-wing">North</p><p class="c4-meta">Floor 4</p></div></li>
      <li data-band="low" data-wing="east"><span class="c4-kcd-spine" aria-hidden="true"></span><div><p>East door pass</p><p class="c4-kcd-wing">East</p></div></li>
    </ul>
  </section>
  <section class="c4-device" aria-label="Customer devices" data-device="1">
    <header class="c4-dvc-head">
      <div>
        <p class="c4-pay-kicker">Devices</p>
        <h2 class="c4-title">Customer devices</h2>
      </div>
      <p class="c4-kcd-count">Rows 2</p>
    </header>
    <p class="c4-meta">Last device already stored on the account.</p>
    <ul class="c4-dvc-rows">
      <li data-device="iPhone"><span class="c4-dvc-spine" aria-hidden="true"></span><p>Ada North</p><p class="c4-meta">iPhone</p></li>
      <li data-device="blank"><span class="c4-dvc-spine" aria-hidden="true"></span><p>Bea</p><p class="c4-meta">No device</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-key c4-key-lararium" aria-label="Key cards" data-key="1" data-desk="lararium">
    <header class="c4-key-lararium-mast">
      <p class="c4-key-lararium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-key-lararium-kicker">Ivory key lararium</p>
        <h2 class="c4-title c4-key-lararium-title">Key cards</h2>
        <p class="c4-key-lararium-lead">Key cards rest in an ivory lararium. Graphite holds the niche. Champagne marks the card in view.</p>
      </div>
      <p class="c4-key-lararium-count">2</p>
    </header>
    <ol class="c4-key-lararium-index" aria-label="Ivory key lararium">
      <li data-tone="gold">Cut 1</li>
      <li data-tone="ink">Issued 1</li>
      <li data-tone="ivory">Returned 0</li>
    </ol>
    <p class="c4-meta c4-key-lararium-hint">A key card stays in this browser.</p>
    <ul class="c4-kcd-rows c4-key-lararium-list">
      <li class="c4-key-lararium-card" data-on="1"><p>North suite spare</p><p class="c4-meta">North · Floor 4</p><div class="c4-row"><button type="button" class="c4-btn">Issue</button><button type="button" class="c4-btn">Copy</button></div></li>
      <li class="c4-key-lararium-card" data-on="0"><p>East door pass</p><p class="c4-meta">East</p><div class="c4-row"><button type="button" class="c4-btn">Hold</button><button type="button" class="c4-btn">Return</button></div></li>
    </ul>
  </section>
  <section class="c4-device c4-device-tepidarium" aria-label="Customer devices" data-device="1" data-desk="tepidarium">
    <header class="c4-device-tepidarium-mast">
      <p class="c4-device-tepidarium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-device-tepidarium-kicker">Graphite device tepidarium</p>
        <h2 class="c4-title c4-device-tepidarium-title">Customer devices</h2>
        <p class="c4-device-tepidarium-lead">Customer devices stand in a graphite tepidarium. Ivory holds the row. Champagne marks the device in view.</p>
      </div>
      <p class="c4-device-tepidarium-count">2</p>
    </header>
    <ol class="c4-device-tepidarium-index" aria-label="Graphite device tepidarium">
      <li data-tone="gold">Named 1</li>
      <li data-tone="ink">No device 1</li>
      <li data-tone="ivory">Leading 1</li>
    </ol>
    <div class="c4-device-tepidarium-chart" aria-label="Customer devices">
      <button type="button" class="c4-device-tepidarium-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Mobile</span></button>
      <button type="button" class="c4-device-tepidarium-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>Desktop</span></button>
      <button type="button" class="c4-device-tepidarium-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Blank</span></button>
    </div>
    <p class="c4-meta c4-device-tepidarium-hint">Last device already stored on the account.</p>
    <ul class="c4-dvc-rows c4-device-tepidarium-list">
      <li class="c4-device-tepidarium-card" data-on="1"><p>Ada North</p><p class="c4-meta">iPhone</p></li>
      <li class="c4-device-tepidarium-card" data-on="0"><p>Bea</p><p class="c4-meta">No device</p></li>
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
  ["crm-round320-before-light.png", "light", before, "1280,1500"],
  ["crm-round320-after-light.png", "light", after, "1280,1900"],
  ["crm-round320-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round320-after-mobile.png", "light", after, "390,2200"],
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
