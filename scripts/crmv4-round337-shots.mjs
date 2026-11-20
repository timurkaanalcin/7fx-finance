/** Before/after shots for the ivory bench caldarium and the graphite plate tabularium. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-bnk" data-benches="1" data-role="desk">
    <header class="c4-bnk-head">
      <p class="c4-bnk-plate" data-logo="mono">7FX</p>
      <div><p class="c4-bnk-kicker">Review desk</p><h2 class="c4-title">Conservatory benches</h2></div>
      <p class="c4-bnk-count">2</p>
    </header>
    <ul class="c4-bnk-rows">
      <li data-light="shade" data-bloom="rose"><span class="c4-bnk-folio">4</span><div><p>Hold the Ada bench</p><p class="c4-meta">Nia · Rose · Shade</p></div></li>
      <li data-light="sun" data-bloom="fern"><span class="c4-bnk-folio">9</span><div><p>Rest the Bea bench</p><p class="c4-meta">No gardener · Fern · Sun</p></div></li>
    </ul>
  </section>
  <section class="c4-plt" data-plates="1">
    <header class="c4-plt-head">
      <div><p class="c4-bnk-kicker">Loaded rows</p><h2 class="c4-title">Country plates</h2></div>
      <p class="c4-bnk-count">Rows 2</p>
    </header>
    <ul class="c4-plt-rows">
      <li><span class="c4-plt-face">A</span><p>Ada North</p><p class="c4-meta">Alpha · Short · Plain</p></li>
      <li><span class="c4-plt-face">B</span><p>Bea West</p><p class="c4-meta">Beta · Mid · Joined</p></li>
    </ul>
  </section>`;

const after = `
  <section class="c4-bnk c4-bnk-caldarium" data-benches="1" data-role="desk" data-desk="caldarium">
    <header class="c4-bnk-head c4-bnk-caldarium-mast">
      <p class="c4-bnk-plate c4-bnk-caldarium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-bnk-kicker c4-bnk-caldarium-kicker">Ivory bench caldarium</p>
        <h2 class="c4-title c4-bnk-caldarium-title">Conservatory benches</h2>
        <p class="c4-bnk-caldarium-lead">Benches rest in an ivory caldarium. Graphite holds the flue. Champagne marks the bench in view.</p>
      </div>
      <p class="c4-bnk-count c4-bnk-caldarium-count">2</p>
    </header>
    <ol class="c4-bnk-caldarium-index" aria-label="Ivory bench caldarium">
      <li data-tone="gold">Open benches 2</li>
      <li data-tone="ink">Rested benches 1</li>
      <li data-tone="ivory">Pressed benches 0</li>
    </ol>
    <ul class="c4-bnk-rows">
      <li class="c4-bnk-caldarium-card" data-light="shade" data-bloom="rose"><span class="c4-bnk-folio">4</span><span class="c4-bnk-marks"></span><div><p>Hold the Ada bench</p><p class="c4-meta">Nia · Rose · Shade · North</p></div><div class="c4-row"><button type="button" class="c4-btn">Pin</button></div></li>
      <li class="c4-bnk-caldarium-card" data-light="sun" data-bloom="fern"><span class="c4-bnk-folio">9</span><span class="c4-bnk-marks"></span><div><p>Rest the Bea bench</p><p class="c4-meta">No gardener · Fern · Sun · East</p></div><div class="c4-row"><button type="button" class="c4-btn">Rest</button></div></li>
    </ul>
  </section>
  <section class="c4-plt c4-plt-tabularium" data-plates="1" data-desk="tabularium">
    <header class="c4-plt-head c4-plt-tabularium-mast">
      <p class="c4-plt-tabularium-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-bnk-kicker c4-plt-tabularium-kicker">Graphite plate tabularium</p>
        <h2 class="c4-title c4-plt-tabularium-title">Country plates</h2>
        <p class="c4-plt-tabularium-lead">Country plates stand in a graphite tabularium. Ivory tablets hold each shelf. Champagne marks the plate in view.</p>
      </div>
      <p class="c4-bnk-count c4-plt-tabularium-count">Rows 2</p>
    </header>
    <ol class="c4-plt-tabularium-index" aria-label="Graphite plate tabularium">
      <li data-tone="gold">2</li>
      <li data-tone="ink">Alpha</li>
      <li data-tone="ivory">Plain</li>
    </ol>
    <ul class="c4-plt-rows">
      <li class="c4-plt-tabularium-card"><span class="c4-plt-face">A</span><p>Ada North</p><p class="c4-meta">Alpha · Short · Plain</p></li>
      <li class="c4-plt-tabularium-card"><span class="c4-plt-face">B</span><p>Bea West</p><p class="c4-meta">Beta · Mid · Joined</p></li>
    </ul>
  </section>`;

function page(theme, mode) {
  const body = mode === "after" ? after : before;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${theme === "dark" ? "#12100e" : "#f4f0e8"};padding:12px 0 28px;">
      ${body}
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true });
const shots = [
  ["crmv4-r337-before-light", "light", "before", 1280, 980],
  ["crmv4-r337-after-light", "light", "after", 1280, 1280],
  ["crmv4-r337-before-dark", "dark", "before", 1280, 980],
  ["crmv4-r337-after-dark", "dark", "after", 1280, 1280],
  ["crmv4-r337-after-mobile", "light", "after", 390, 1400],
];
for (const [name, theme, mode, width, height] of shots) {
  const pageObj = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await pageObj.setContent(page(theme, mode), { waitUntil: "load" });
  const file = path.join(out, `${name}.png`);
  await pageObj.screenshot({ path: file, fullPage: true });
  await pageObj.close();
  console.log(file);
}
await browser.close();
