/** Before/after shots for the ivory folio pinacotheca and the graphite natal horreum. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-fol" aria-label="Folio slips" data-folio="1">
    <header class="c4-fol-head">
      <p class="c4-fol-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">This shift</p>
        <h2 class="c4-title">Folio slips</h2>
      </div>
      <p class="c4-fol-count">2</p>
    </header>
    <p class="c4-meta">A short folio stays in this browser.</p>
    <ul class="c4-fol-rows">
      <li data-band="mid"><span class="c4-fol-day">10</span><div><p>North bay slip</p><p class="c4-meta">Open · Hall</p></div></li>
      <li data-band="low"><span class="c4-fol-day">14</span><div><p>East aisle note</p><p class="c4-meta">Held</p></div></li>
    </ul>
  </section>
  <section class="c4-ntl" aria-label="Registration months" data-natal="1">
    <header class="c4-ntl-head">
      <div>
        <p class="c4-pay-kicker">Months</p>
        <h2 class="c4-title">Registration months</h2>
      </div>
      <p class="c4-fol-count">Rows 2</p>
    </header>
    <p class="c4-meta">Month already stored on the account.</p>
    <ul class="c4-ntl-rows">
      <li data-mark="2024-03"><span class="c4-ntl-spine"></span><p>Ada North</p><p class="c4-meta">March</p></li>
      <li data-mark="blank"><span class="c4-ntl-spine"></span><p>Bea</p><p class="c4-meta">No month</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-fol c4-fol-pinacotheca" aria-label="Folio slips" data-folio="1" data-desk="pinacotheca">
    <header class="c4-fol-head c4-fol-pinacotheca-mast">
      <p class="c4-fol-plate c4-fol-pinacotheca-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-fol-pinacotheca-kicker">Ivory folio pinacotheca</p>
        <h2 class="c4-title c4-fol-pinacotheca-title">Folio slips</h2>
        <p class="c4-fol-pinacotheca-lead">Folio slips hang in an ivory pinacotheca. Graphite holds the frame. Champagne marks the slip in view.</p>
      </div>
      <p class="c4-fol-count c4-fol-pinacotheca-count">2</p>
    </header>
    <ol class="c4-fol-pinacotheca-index" aria-label="Ivory folio pinacotheca">
      <li data-tone="gold">Open 1</li>
      <li data-tone="ink">Held 1</li>
      <li data-tone="ivory">Done 0</li>
    </ol>
    <p class="c4-meta">A short folio stays in this browser.</p>
    <ul class="c4-fol-rows">
      <li class="c4-fol-pinacotheca-card" data-on="1"><span class="c4-fol-day">10</span><div><p>North bay slip</p><p class="c4-meta">Open · Hall</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Copy</button></div></div></li>
      <li class="c4-fol-pinacotheca-card" data-on="0"><span class="c4-fol-day">14</span><div><p>East aisle note</p><p class="c4-meta">Held</p><div class="c4-row"><button type="button" class="c4-btn">Release</button><button type="button" class="c4-btn">Edit</button></div></div></li>
    </ul>
  </section>
  <section class="c4-ntl c4-ntl-horreum" aria-label="Registration months" data-natal="1" data-desk="horreum">
    <header class="c4-ntl-head c4-ntl-horreum-mast">
      <p class="c4-ntl-horreum-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-ntl-horreum-kicker">Graphite natal horreum</p>
        <h2 class="c4-title c4-ntl-horreum-title">Registration months</h2>
        <p class="c4-ntl-horreum-lead">Registration months stand in a graphite horreum. Ivory holds the bin. Champagne marks the month in view.</p>
      </div>
      <p class="c4-fol-count c4-ntl-horreum-count">2</p>
    </header>
    <ol class="c4-ntl-horreum-index" aria-label="Graphite natal horreum">
      <li data-tone="gold">Leading March</li>
      <li data-tone="ink">Rows 2</li>
      <li data-tone="ivory">Generations 2</li>
    </ol>
    <div class="c4-ntl-horreum-chart" aria-label="Generation">
      <button type="button" class="c4-ntl-horreum-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Recent</span></button>
      <button type="button" class="c4-ntl-horreum-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>Blank</span></button>
      <button type="button" class="c4-ntl-horreum-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Other</span></button>
    </div>
    <p class="c4-meta">Month already stored on the account.</p>
    <ul class="c4-ntl-rows">
      <li class="c4-ntl-horreum-card" data-on="1"><span class="c4-ntl-spine"></span><p>Ada North</p><p class="c4-meta">March</p></li>
      <li class="c4-ntl-horreum-card" data-on="0"><span class="c4-ntl-spine"></span><p>Bea</p><p class="c4-meta">No month</p></li>
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
  ["crm-round326-before-light.png", "light", before, "1280,1500"],
  ["crm-round326-after-light.png", "light", after, "1280,1900"],
  ["crm-round326-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round326-after-mobile.png", "light", after, "390,2200"],
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
