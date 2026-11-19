/** Before/after shots for the ivory stack hypogeum and the graphite atlas mithraeum. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-stack" aria-label="Stack slips" data-stack="1">
    <header class="c4-slp-head">
      <p class="c4-slp-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">Stack</p>
        <h2 class="c4-title">Stack slips</h2>
      </div>
      <p class="c4-slp-count">2</p>
    </header>
    <p class="c4-meta">A stack slip stays in this browser.</p>
    <ul class="c4-slp-rows">
      <li data-band="mid"><span class="c4-slp-spine" aria-hidden="true"></span><div><p>North bay slip</p><p class="c4-meta">Waiting</p></div></li>
      <li data-band="low"><span class="c4-slp-spine" aria-hidden="true"></span><div><p>East aisle note</p><p class="c4-meta">On loan</p></div></li>
    </ul>
  </section>
  <section class="c4-atlas" aria-label="Addresses" data-atlas="1">
    <header class="c4-atl-head">
      <div>
        <p class="c4-pay-kicker">Atlas</p>
        <h2 class="c4-title">Addresses</h2>
      </div>
      <p class="c4-slp-count">Rows 2</p>
    </header>
    <p class="c4-meta">Address already stored on the account.</p>
    <ul class="c4-atl-rows">
      <li data-atlas="Apt 4"><span class="c4-atl-spine" aria-hidden="true"></span><p>Ada North</p><p class="c4-meta">Apt 4</p></li>
      <li data-atlas="blank"><span class="c4-atl-spine" aria-hidden="true"></span><p>Bea</p><p class="c4-meta">No address</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-stack c4-stack-hypogeum" aria-label="Stack slips" data-stack="1" data-desk="hypogeum">
    <header class="c4-stack-hypogeum-mast">
      <p class="c4-stack-hypogeum-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-stack-hypogeum-kicker">Ivory stack hypogeum</p>
        <h2 class="c4-title c4-stack-hypogeum-title">Stack slips</h2>
        <p class="c4-stack-hypogeum-lead">Stack slips rest in an ivory hypogeum. Graphite holds the vault. Champagne marks the slip in view.</p>
      </div>
      <p class="c4-stack-hypogeum-count">2</p>
    </header>
    <ol class="c4-stack-hypogeum-index" aria-label="Ivory stack hypogeum">
      <li data-tone="gold">Waiting 1</li>
      <li data-tone="ink">Loaned 1</li>
      <li data-tone="ivory">Returned 0</li>
    </ol>
    <p class="c4-meta c4-stack-hypogeum-hint">A stack slip stays in this browser.</p>
    <ul class="c4-slp-rows">
      <li class="c4-stack-hypogeum-card" data-on="1"><span class="c4-slp-spine" aria-hidden="true"></span><div><p>North bay slip</p><p class="c4-meta">Waiting · Mid</p><div class="c4-row"><button type="button" class="c4-btn">Loan</button><button type="button" class="c4-btn">Copy</button></div></div></li>
      <li class="c4-stack-hypogeum-card" data-on="0"><span class="c4-slp-spine" aria-hidden="true"></span><div><p>East aisle note</p><p class="c4-meta">On loan</p><div class="c4-row"><button type="button" class="c4-btn">Return</button><button type="button" class="c4-btn">Edit</button></div></div></li>
    </ul>
  </section>
  <section class="c4-atlas c4-atlas-mithraeum" aria-label="Addresses" data-atlas="1" data-desk="mithraeum">
    <header class="c4-atlas-mithraeum-mast">
      <p class="c4-atlas-mithraeum-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-atlas-mithraeum-kicker">Graphite atlas mithraeum</p>
        <h2 class="c4-title c4-atlas-mithraeum-title">Addresses</h2>
        <p class="c4-atlas-mithraeum-lead">Addresses stand in a graphite mithraeum. Ivory holds the row. Champagne marks the address in view.</p>
      </div>
      <p class="c4-atlas-mithraeum-count">2</p>
    </header>
    <ol class="c4-atlas-mithraeum-index" aria-label="Graphite atlas mithraeum">
      <li data-tone="gold">Leading Apt</li>
      <li data-tone="ink">Rows 2</li>
      <li data-tone="ivory">Blank 1</li>
    </ol>
    <div class="c4-atlas-mithraeum-chart" aria-label="Addresses">
      <button type="button" class="c4-atlas-mithraeum-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Box</span></button>
      <button type="button" class="c4-atlas-mithraeum-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>Street</span></button>
      <button type="button" class="c4-atlas-mithraeum-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Blank</span></button>
    </div>
    <p class="c4-meta c4-atlas-mithraeum-hint">Address already stored on the account.</p>
    <ul class="c4-atl-rows">
      <li class="c4-atlas-mithraeum-card" data-on="1"><span class="c4-atl-spine" aria-hidden="true"></span><p>Ada North</p><p class="c4-meta">Apt 4</p></li>
      <li class="c4-atlas-mithraeum-card" data-on="0"><span class="c4-atl-spine" aria-hidden="true"></span><p>Bea</p><p class="c4-meta">No address</p></li>
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
  ["crm-round321-before-light.png", "light", before, "1280,1500"],
  ["crm-round321-after-light.png", "light", after, "1280,1900"],
  ["crm-round321-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round321-after-mobile.png", "light", after, "390,2200"],
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
