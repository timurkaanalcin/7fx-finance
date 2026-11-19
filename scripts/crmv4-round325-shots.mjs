/** Before/after shots for the ivory interlude schola and the graphite vintage piscina. */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-itl" aria-label="Interlude cards" data-interlude="1">
    <header class="c4-itl-head">
      <p class="c4-itl-plate" data-logo="mono">7FX</p>
      <div>
        <p class="c4-pay-kicker">This shift</p>
        <h2 class="c4-title">Interlude cards</h2>
      </div>
      <p class="c4-itl-count">2</p>
    </header>
    <p class="c4-meta">A short interlude stays in this browser.</p>
    <ul class="c4-itl-rows">
      <li data-band="mid"><span class="c4-itl-hour">10</span><div><p>North bay pause</p><p class="c4-meta">Open · Hall</p></div></li>
      <li data-band="low"><span class="c4-itl-hour">14</span><div><p>East aisle note</p><p class="c4-meta">Held</p></div></li>
    </ul>
  </section>
  <section class="c4-vnt" aria-label="Registration vintages" data-vintage="1">
    <header class="c4-vnt-head">
      <div>
        <p class="c4-pay-kicker">Years</p>
        <h2 class="c4-title">Registration vintages</h2>
      </div>
      <p class="c4-itl-count">Rows 2</p>
    </header>
    <p class="c4-meta">Year already stored on the account.</p>
    <ul class="c4-vnt-rows">
      <li data-year="2024"><span class="c4-vnt-spine"></span><p>Ada North</p><p class="c4-meta">2024</p></li>
      <li data-year="blank"><span class="c4-vnt-spine"></span><p>Bea</p><p class="c4-meta">No year</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-itl c4-itl-schola" aria-label="Interlude cards" data-interlude="1" data-desk="schola">
    <header class="c4-itl-head c4-itl-schola-mast">
      <p class="c4-itl-plate c4-itl-schola-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-itl-schola-kicker">Ivory interlude schola</p>
        <h2 class="c4-title c4-itl-schola-title">Interlude cards</h2>
        <p class="c4-itl-schola-lead">Interlude cards sit in an ivory schola. Graphite holds the bench. Champagne marks the card in view.</p>
      </div>
      <p class="c4-itl-count c4-itl-schola-count">2</p>
    </header>
    <ol class="c4-itl-schola-index" aria-label="Ivory interlude schola">
      <li data-tone="gold">Open 1</li>
      <li data-tone="ink">Held 1</li>
      <li data-tone="ivory">Done 0</li>
    </ol>
    <p class="c4-meta">A short interlude stays in this browser.</p>
    <ul class="c4-itl-rows">
      <li class="c4-itl-schola-card" data-on="1"><span class="c4-itl-hour">10</span><div><p>North bay pause</p><p class="c4-meta">Open · Hall</p><div class="c4-row"><button type="button" class="c4-btn">Pin</button><button type="button" class="c4-btn">Copy</button></div></div></li>
      <li class="c4-itl-schola-card" data-on="0"><span class="c4-itl-hour">14</span><div><p>East aisle note</p><p class="c4-meta">Held</p><div class="c4-row"><button type="button" class="c4-btn">Release</button><button type="button" class="c4-btn">Edit</button></div></div></li>
    </ul>
  </section>
  <section class="c4-vnt c4-vnt-piscina" aria-label="Registration vintages" data-vintage="1" data-desk="piscina">
    <header class="c4-vnt-head c4-vnt-piscina-mast">
      <p class="c4-vnt-piscina-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-vnt-piscina-kicker">Graphite vintage piscina</p>
        <h2 class="c4-title c4-vnt-piscina-title">Registration vintages</h2>
        <p class="c4-vnt-piscina-lead">Registration vintages stand in a graphite piscina. Ivory holds the waterline. Champagne marks the year in view.</p>
      </div>
      <p class="c4-itl-count c4-vnt-piscina-count">2</p>
    </header>
    <ol class="c4-vnt-piscina-index" aria-label="Graphite vintage piscina">
      <li data-tone="gold">Leading 2024</li>
      <li data-tone="ink">Rows 2</li>
      <li data-tone="ivory">Kinds 2</li>
    </ol>
    <div class="c4-vnt-piscina-chart" aria-label="Kind">
      <button type="button" class="c4-vnt-piscina-column" data-on="1"><i style="height:72px"></i><strong>1</strong><span>Recent</span></button>
      <button type="button" class="c4-vnt-piscina-column" data-on="0"><i style="height:36px"></i><strong>1</strong><span>Blank</span></button>
      <button type="button" class="c4-vnt-piscina-column" data-on="0"><i style="height:18px"></i><strong>0</strong><span>Other</span></button>
    </div>
    <p class="c4-meta">Year already stored on the account.</p>
    <ul class="c4-vnt-rows">
      <li class="c4-vnt-piscina-card" data-on="1"><span class="c4-vnt-spine"></span><p>Ada North</p><p class="c4-meta">2024</p></li>
      <li class="c4-vnt-piscina-card" data-on="0"><span class="c4-vnt-spine"></span><p>Bea</p><p class="c4-meta">No year</p></li>
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
  ["crm-round325-before-light.png", "light", before, "1280,1500"],
  ["crm-round325-after-light.png", "light", after, "1280,1900"],
  ["crm-round325-after-dark.png", "dark", after, "1280,1900"],
  ["crm-round325-after-mobile.png", "light", after, "390,2200"],
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
