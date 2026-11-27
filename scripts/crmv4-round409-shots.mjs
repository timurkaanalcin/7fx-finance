/** Before/after shots for the ivory agent quirk and the graphite arrange pedestal. */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(new URL("../src/components/crmv4/crmv4.css", import.meta.url), "utf8");

const before = `
  <section class="c4-perf-luxe" aria-label="Team board">
    <div class="c4-fin-hero">
      <div class="c4-fin-metric"><span>Team board</span><strong>2</strong></div>
      <div class="c4-fin-metric"><span>Assigned</span><strong>14</strong></div>
    </div>
    <p class="c4-muted c4-pad">Rank the desk by the metric in view.</p>
    <div class="c4-row c4-pad">
      <button type="button" class="c4-chip" data-on="1">Assigned</button>
      <button type="button" class="c4-chip">Funded</button>
      <button type="button" class="c4-chip">Calls</button>
      <button type="button" class="c4-btn">Export CSV</button>
    </div>
    <ul class="c4-perf-cards">
      <li class="c4-perf-card" data-top="1"><strong>1</strong><span>Ada</span><span>Assigned 8</span><span>Funded 3</span></li>
      <li class="c4-perf-card"><strong>2</strong><span>Bea</span><span>Assigned 6</span><span>Funded 1</span></li>
    </ul>
  </section>
  <section class="c4-arrange-luxe" aria-label="Arrange desk" data-arrange="1">
    <h3 class="c4-title">Arrange desk</h3>
    <p class="c4-muted">Show, hide, and order the overview cards.</p>
    <ul class="c4-arrange-list">
      <li data-on="1"><label class="c4-row"><input type="checkbox" checked /><span>Alerts</span></label><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></li>
      <li data-on="1"><label class="c4-row"><input type="checkbox" checked /><span>Team</span></label><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></li>
      <li data-on="0"><label class="c4-row"><input type="checkbox" /><span>Tasks</span></label><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></li>
    </ul>
    <button type="button" class="c4-btn">Reset</button>
  </section>`;

const after = `
  <section class="c4-perf-luxe c4-perf-quirk" aria-label="Team board" data-perf-quirk="1">
    <header class="c4-perf-quirk-mast">
      <p class="c4-perf-quirk-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-perf-quirk-kicker">Ivory agent quirk</p>
        <h2 class="c4-title">Team board</h2>
        <p class="c4-perf-quirk-lead">The team board sits on ivory. Graphite holds the rank. Champagne rules the quirk edge.</p>
      </div>
    </header>
    <div class="c4-fin-hero">
      <div class="c4-fin-metric"><span>Team board</span><strong>2</strong></div>
      <div class="c4-fin-metric"><span>Assigned</span><strong>14</strong></div>
    </div>
    <p class="c4-perf-quirk-lead">Rank the desk by the metric in view.</p>
    <div class="c4-row c4-pad">
      <button type="button" class="c4-chip" data-on="1">Assigned</button>
      <button type="button" class="c4-chip">Funded</button>
      <button type="button" class="c4-chip">Calls</button>
      <button type="button" class="c4-btn">Export CSV</button>
    </div>
    <ul class="c4-perf-cards">
      <li class="c4-perf-card" data-top="1"><strong>1</strong><span>Ada</span><span>Assigned 8</span><span>Funded 3</span></li>
      <li class="c4-perf-card"><strong>2</strong><span>Bea</span><span>Assigned 6</span><span>Funded 1</span></li>
    </ul>
  </section>
  <section class="c4-arrange-luxe c4-arrange-pedestal" aria-label="Arrange desk" data-arrange="1" data-arrange-pedestal="1">
    <header class="c4-arrange-pedestal-mast">
      <p class="c4-arrange-pedestal-seal" data-logo="mono">7FX</p>
      <div>
        <p class="c4-arrange-pedestal-kicker">Graphite arrange pedestal</p>
        <h3 class="c4-title">Arrange desk</h3>
        <p class="c4-arrange-pedestal-lead">Desk cards sit on graphite. Ivory type stays readable. Champagne rules the pedestal step.</p>
      </div>
    </header>
    <p class="c4-muted">Show, hide, and order the overview cards.</p>
    <ul class="c4-arrange-list">
      <li data-on="1"><label class="c4-row"><input type="checkbox" checked /><span>Alerts</span></label><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></li>
      <li data-on="1"><label class="c4-row"><input type="checkbox" checked /><span>Team</span></label><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></li>
      <li data-on="0"><label class="c4-row"><input type="checkbox" /><span>Tasks</span></label><button type="button" class="c4-btn">Up</button><button type="button" class="c4-btn">Down</button></li>
    </ul>
    <button type="button" class="c4-btn">Reset</button>
  </section>`;

function page(theme, mode) {
  const body = mode === "after" ? after : before;
  const ground = theme === "dark" ? "#12100e" : "#f4f0e8";
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="margin:0;background:${ground};">
    <div data-crmv4-root data-theme="${theme}" style="height:auto;display:block;background:${ground};padding:12px 0 28px;">
      ${body}
    </div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const shots = [
  ["crmv4-r409-before-light", "light", "before", 1280, 980],
  ["crmv4-r409-after-light", "light", "after", 1280, 1280],
  ["crmv4-r409-before-dark", "dark", "before", 1280, 980],
  ["crmv4-r409-after-dark", "dark", "after", 1280, 1280],
  ["crmv4-r409-after-mobile", "light", "after", 390, 1400],
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
